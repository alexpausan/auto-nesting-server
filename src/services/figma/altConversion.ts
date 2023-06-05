import { convertNodesThatActAsBG } from './convertNodesThatActAsBG'
// import { convertToAutoLayout } from './convertToAutoLayout'

// @TODO: refactor types to be more specific for my usecase
import { AltSceneNode, AltRectangleNode, AltFrameNode, AltGroupNode } from './altMixins'

const ASSET_TYPES = {
  VECTOR: true,
  ELLIPSE: true,
  STAR: true,
  POLYGON: true,
  RECTANGLE: true,
}

type NodeWithChildren = FrameNode | InstanceNode | ComponentNode | GroupNode

export const convertIntoAltNodes = (
  sceneNode: ReadonlyArray<AltSceneNode>,
  altParent: AltFrameNode | AltGroupNode | null = null
): Array<AltSceneNode> => {
  const mapped: Array<AltSceneNode | null> = sceneNode.map((node: AltSceneNode) => {
    const { type, visible, rotation } = node

    // We skip the invisible nodes. By default no value is sent
    if (visible === false) {
      return null
    }

    if (type in ASSET_TYPES) {
      return {
        ...node,
        type: 'VECTOR',
      } as AltSceneNode
    }

    // If it is rotated, Figma will take the height of the bounding box.
    // We use that too and apply transform. We apply it for any other type than Vectors
    if (rotation !== undefined && Math.round(rotation) !== 0) {
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
          exportAsSVG: true,
        } as AltFrameNode
      }

      altNode.children = convertIntoAltNodes(children as Array<AltSceneNode>, altNode)

      return convertNodesThatActAsBG(altNode)
    }

    return node
  })

  return mapped.filter(notEmpty)
}

const containsOnlyVectors = (node: NodeWithChildren): boolean => {
  return node.children.every((d) => ASSET_TYPES[d.type])
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}
