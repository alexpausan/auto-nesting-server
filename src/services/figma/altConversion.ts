import { getBoundingRect as getBoundingRectFigma } from '@figma-plugin/helpers'

// import { convertNodesOnRectangle } from './convertNodesOnRectangle'
// import { convertToAutoLayout } from './convertToAutoLayout'

// @TODO: refactor types to be more specific for my usecase
import {
  AltSceneNode,
  AltRectangleNode,
  AltFrameNode,
  AltGroupNode,
  AltVectorNode,
} from './altMixins'

const VECTOR_TYPES = {
  VECTOR: true,
  ELLIPSE: true,
  STAR: true,
  POLYGON: true,
  RECTANGLE: true,
}

const SVG_INDICATOR: ImagePaint = {
  type: 'IMAGE',
  imageHash: 'SVG-TRANSFORM',
  scaleMode: 'FIT',
}

type NodeWithChildren = FrameNode | InstanceNode | ComponentNode | GroupNode
type RestType = Omit<AltSceneNode, 'type'>

export const convertIntoAltNodes = (
  sceneNode: ReadonlyArray<AltSceneNode>,
  altParent: AltFrameNode | AltGroupNode | null = null
): Array<AltSceneNode> => {
  const mapped: Array<AltSceneNode | null> = sceneNode.map((node: AltSceneNode) => {
    const { type, visible, rotation } = node

    // We skip the invisible nodes
    if (!visible) {
      return null
    }

    if (type in VECTOR_TYPES) {
      return {
        ...node,
        type: 'VECTOR',
      } as AltSceneNode
    }

    // If it is rotated, Figma will take the height of the bounding box.
    // We use that too and apply transform. We apply it for any other type than Vectors
    if (rotation !== undefined && Math.round(rotation) !== 0) {
      // @ts-ignore
      node.height = node.absoluteBoundingBox.height
      // @ts-ignore
      node.transform = `rotate(${Math.round(rotation)}deg)`
    }

    if (type === 'LINE') {
      const { type, ...rest } = node

      const altNode = new AltRectangleNode()
      Object.assign(altNode, rest)

      // Lines have a height of zero, and we replace it with the stroke value
      altNode.height = altNode.strokeWeight
      altNode.strokeWeight = 0

      // Given it will be a rectangle, the line should be centered
      altNode.strokeAlign = 'CENTER'
      return altNode
    }

    if (type === 'GROUP' || type === 'FRAME' || type === 'INSTANCE' || type === 'COMPONENT') {
      const { children } = node
      const { type, ...rest } = node

      const altNode = new AltFrameNode()
      Object.assign(altNode, rest)

      // if it has no children, convert frame to rectangle.
      // Groups cannot be in this situation so we're ok
      if (children.length === 0) {
        return {
          ...node,
          type: 'RECTANGLE',
        } as AltRectangleNode
      }

      if (children.length === 1) {
        // Skip it and return the child if Group has only one child,
        if (type === 'GROUP') {
          const processedChild = convertIntoAltNodes(children as Array<AltSceneNode>, altParent)
          return processedChild[0]
        }

        // Fix this: https://stackoverflow.com/questions/57859754/flexbox-space-between-but-center-if-one-element
        // It affects HTML, Tailwind, Flutter and possibly SwiftUI. So, let's be consistent.
        if (node.primaryAxisAlignItems === 'SPACE_BETWEEN') {
          altNode.primaryAxisAlignItems = 'CENTER'
        }
      }

      if (containsOnlyVectors(node as NodeWithChildren)) {
        return {
          ...altNode,
          fills: [SVG_INDICATOR],
        } as AltFrameNode
      }

      altNode.children = convertIntoAltNodes(children as Array<AltSceneNode>, altNode)
      return altNode
    }

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
    // console.log(node.x, node.y, boundingRect)
    // console.log(node)
    // console.log(node.x, node.y, boundingRect)
    node.x = boundingRect.x
    node.y = boundingRect.y
  }

  return node
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}
