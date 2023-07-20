import { convertNodesThatActAsBG } from './convertNodesThatActAsBG'
import { convertToAutoLayout } from './convertToAutoLayout'

// @TODO: refactor types to be more specific for my usecase
import { AltSceneNode, AltRectangleNode, AltFrameNode, AltGroupNode } from './altTypes'

const VECTOR_TYPES = {
  VECTOR: true,
  ELLIPSE: true,
  STAR: true,
  POLYGON: true,
  RECTANGLE: true,
}

type NodeWithChildren = FrameNode | InstanceNode | ComponentNode | GroupNode

export const convertIntoAltNodes = (
  sceneNode: ReadonlyArray<AltSceneNode>,
  altParent: AltFrameNode | AltGroupNode | null = null,
): Array<AltSceneNode> => {
  const resultNodes = sceneNode.map((node) => {
    const { type, visible, rotation } = node

    // If it is rotated, Figma will take the height of the bounding box.
    // We use that too and apply transform. We apply it for any other type than Vectors
    if (rotation !== undefined && Math.round(rotation) !== 0) {
      // @ts-ignore
      node.transform = `rotate(${Math.round(rotation)}deg)`
    }

    // We skip the invisible nodes. By default no value is sent
    if (visible === false) {
      return null
    }

    if (type in VECTOR_TYPES) {
      // @TODO: when it's a rectangle, check if it's a "background" and convert it to a frame
      // See "Frame 5 - to check vector" from Figma file
      return {
        ...node,
        type: 'VECTOR',
      } as AltSceneNode
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

    if (type === 'GROUP' || type === 'FRAME' || type === 'COMPONENT' || type === 'INSTANCE') {
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

      // Skip the element as the group has no HTML equivalent. It will be just a div in div. We return the child
      if (children.length === 1 && type === 'GROUP') {
        const processedChild = convertIntoAltNodes(children as Array<AltSceneNode>, altParent)
        return processedChild[0]
      }

      // TODO: postpone this for later
      // Fix this: https://stackoverflow.com/questions/57859754/flexbox-space-between-but-center-if-one-element
      // It affects HTML, Tailwind, Flutter and possibly SwiftUI. So, let's be consistent.
      // if (node.primaryAxisAlignItems === 'SPACE_BETWEEN') {
      // altNode.primaryAxisAlignItems = 'CENTER'
      // }

      if (containsOnlyVectors(node as NodeWithChildren)) {
        return {
          ...altNode,
          exportAsSVG: true,
        } as AltFrameNode
      }

      // Do the same processing for the children
      altNode.children = convertIntoAltNodes(children as Array<AltSceneNode>, altNode)

      return convertToAutoLayout(convertNodesThatActAsBG(altNode))
    }

    return node
  })

  return resultNodes.filter(notEmpty)
}

const containsOnlyVectors = (node: NodeWithChildren): boolean => {
  return node.children.every((child) => VECTOR_TYPES[child.type])
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}
