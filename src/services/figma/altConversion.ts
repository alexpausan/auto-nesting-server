import { getBoundingRect as getBoundingRectFigma } from '@figma-plugin/helpers'

// import { convertNodesOnRectangle } from './convertNodesOnRectangle'
// import { convertToAutoLayout } from './convertToAutoLayout'

import { AltSceneNode, AltRectangleNode, AltFrameNode, AltGroupNode } from './altMixins'

const VECTOR_TYPES = {
  VECTOR: true,
  ELLIPSE: true,
  STAR: true,
  POLYGON: true,
}

const SVG_INDICATOR: ImagePaint = {
  type: 'IMAGE',
  imageHash: 'SVG-TRANSFORM',
  scaleMode: 'FIT',
}

type FrameTypes = FrameNode | InstanceNode | ComponentNode
type NodeWithChildren = FrameNode | InstanceNode | ComponentNode | GroupNode

export const convertIntoAltNodes = (
  sceneNode: ReadonlyArray<AltSceneNode>,
  altParent: AltFrameNode | AltGroupNode | null = null
): Array<AltSceneNode> => {
  const mapped: Array<AltSceneNode | null> = sceneNode.map((node: AltSceneNode) => {
    const { type, visible } = node

    // We skip the invisible nodes
    if (!visible) {
      return null
    }

    if (type === 'LINE') {
      const altNode = computeLayout(node) as AltRectangleNode

      // Lines have a height of zero, and we replace it with the stroke value
      altNode.height = altNode.strokeWeight
      altNode.strokeWeight = 0

      // Given it will be a rectangle, the line should be centered
      altNode.strokeAlign = 'CENTER'
      return altNode
    }

    if (type === 'GROUP') {
      const { children } = node
      // if Group has only one child, we skip it and return it's child
      if (children.length === 1) {
        const processedChild = convertIntoAltNodes(children as Array<AltSceneNode>, altParent)
        return processedChild[0]
      }

      const altNode = computeLayout(node) as AltGroupNode

      // When all children are vector, we set the Fill with an indicator that will be processed in Figma
      if (containsOnlyVectors(node as NodeWithChildren)) {
        return {
          ...altNode,
          fills: [SVG_INDICATOR],
        }
      }

      altNode.children = convertIntoAltNodes(children as Array<AltSceneNode>, altNode)
      // try to find big rect and regardless of that result, also try to convert to autolayout.
      // There is a big chance this will be returned as a Frame
      // also, Group will always have at least 2 children.
      return altNode
    }

    if (type === 'FRAME' || type === 'INSTANCE' || type === 'COMPONENT') {
      const { children } = node
      const altNode = computeLayout(node) as AltFrameNode

      // if it has no children, convert frame to rectangle
      if (children.length === 0) {
        return {
          ...altNode,
          type: 'RECTANGLE',
        }
      }

      if (containsOnlyVectors(node as NodeWithChildren)) {
        return {
          ...altNode,
          fills: [SVG_INDICATOR],
        }
      }

      // Fix this: https://stackoverflow.com/questions/57859754/flexbox-space-between-but-center-if-one-element
      // It affects HTML, Tailwind, Flutter and possibly SwiftUI. So, let's be consistent.
      if (children.length === 1 && node.primaryAxisAlignItems === 'SPACE_BETWEEN') {
        altNode.primaryAxisAlignItems = 'CENTER'
      }

      altNode.children = convertIntoAltNodes(node.children as Array<AltSceneNode>, altNode)

      return altNode
    }

    if (type in VECTOR_TYPES) {
      node = computeLayout(node)

      return {
        ...node,
        type: 'VECTOR',
      } as AltSceneNode
    }

    node = computeLayout(node)
    return node
  })

  return mapped.filter(notEmpty)
}

const containsOnlyVectors = (node: NodeWithChildren): boolean => {
  return node.children.every((d) => VECTOR_TYPES[d.type])
}

// @TODO: decide if I should apply transnform: rotate(node.rotation)
const computeLayout = (node: AltSceneNode): AltSceneNode => {
  // Get the correct X/Y position when rotation is applied.
  // This won't guarantee a perfect position, since we would still
  // need to calculate the offset based on node width/height to compensate,
  // which we are not currently doing. However, this is a lot better than nothing and will help LineNode.

  if (node.rotation !== undefined && Math.round(node.rotation) !== 0) {
    const boundingRect = getBoundingRectFigma([node] as SceneNode[])
    node.x = boundingRect.x
    node.y = boundingRect.y
  }

  return node
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}
