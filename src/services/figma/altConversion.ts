import { getBoundingRect as getBoundingRectFigma } from '@figma-plugin/helpers'

import { convertNodesOnRectangle } from './convertNodesOnRectangle'
import {
  AltSceneNode,
  AltRectangleNode,
  AltFrameNode,
  AltTextNode,
  AltGroupNode,
  AltLayoutMixin,
  AltFrameMixin,
  AltGeometryMixin,
  AltBlendMixin,
  AltCornerMixin,
  AltRectangleCornerMixin,
  AltDefaultShapeMixin,
} from './altMixins'

const NODE_IS_VECTOR = {
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

// import { convertToAutoLayout } from './convertToAutoLayout'

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
      node = computeLayout(node) as AltRectangleNode

      // Lines have a height of zero, but they must have a height, so add 1.
      node.height = 1
      // Given it will be a rectangle, the line should be centered
      node.strokeAlign = 'CENTER'
      // Remove 1 since it now has a height of 1. It won't be visually perfect, but will be almost.
      console.log(node.strokeWeight)
      node.strokeWeight = node.strokeWeight - 1

      return node
    }

    if (type === 'FRAME' || type === 'INSTANCE' || type === 'COMPONENT') {
      if (containsOnlyVectors(node as NodeWithChildren)) {
        node.fills = [SVG_INDICATOR]
        return node
      }

      return frameNodeToAlt(node as FrameNodeToAlt, altParent)
    }

    if (type === 'GROUP') {
      // if Group has only one child, we skip it
      if (node.children.length === 1) {
        console.log(111)

        return convertIntoAltNodes(node.children as Array<AltSceneNode>, altParent)[0]
      }

      if (containsOnlyVectors(node as NodeWithChildren)) {
        const altNode = new AltFrameNode()
        console.log(222)
        altNode.fills = [SVG_INDICATOR]
        return node
      }

      const altNode = computeLayout(node) as AltGroupNode

      altNode.children = convertIntoAltNodes(node.children as Array<AltSceneNode>, altNode)

      // try to find big rect and regardless of that result, also try to convert to autolayout.
      // There is a big chance this will be returned as a Frame
      // also, Group will always have at least 2 children.

      return convertNodesOnRectangle(altNode)
    }

    if (NODE_IS_VECTOR[type]) {
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

export const convertSingleNodeToAlt = (
  node: AltSceneNode,
  parent: AltFrameNode | AltGroupNode | null = null
): AltSceneNode => {
  return convertIntoAltNodes([node], parent)[0]
}

type FrameNodeToAlt = FrameNode | InstanceNode | ComponentNode

export const frameNodeToAlt = (
  node: FrameNodeToAlt,
  altParent: AltFrameNode | AltGroupNode | null = null
): AltRectangleNode | AltFrameNode | AltGroupNode => {
  if (node.children.length === 0) {
    // if it has no children, convert frame to rectangle
    return frameToRectangleNode(node, altParent)
  }

  const altNode = new AltFrameNode()

  altNode.id = node.id
  altNode.name = node.name

  if (altParent) {
    altNode.parent = altParent
  }

  convertDefaultShape(altNode, node)
  convertFrame(altNode, node)
  convertCorner(altNode, node)
  convertRectangleCorner(altNode, node)

  altNode.children = convertIntoAltNodes(node.children as Array<AltSceneNode>, altNode)

  return convertNodesOnRectangle(altNode)
}

// auto convert Frame to Rectangle when Frame has no Children
const frameToRectangleNode = (
  node: FrameNode | InstanceNode | ComponentNode,
  altParent: AltFrameNode | AltGroupNode | null
): AltRectangleNode => {
  const newNode = new AltRectangleNode()

  newNode.id = node.id
  newNode.name = node.name

  if (altParent) {
    newNode.parent = altParent
  }

  convertDefaultShape(newNode, node)
  convertRectangleCorner(newNode, node)
  convertCorner(newNode, node)
  return newNode
}

type NodeWithChildren = FrameNode | InstanceNode | ComponentNode | GroupNode

const containsOnlyVectors = (node: NodeWithChildren): boolean => {
  return node.children.every((d) => NODE_IS_VECTOR[d.type])
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

const convertLayout = (altNode: AltLayoutMixin, node: LayoutMixin) => {
  // Get the correct X/Y position when rotation is applied.
  // This won't guarantee a perfect position, since we would still
  // need to calculate the offset based on node width/height to compensate,
  // which we are not currently doing. However, this is a lot better than nothing and will help LineNode.
  if (node.rotation !== undefined && Math.round(node.rotation) !== 0) {
    // const boundingRect = getBoundingRect(node)
    // altNode.x = boundingRect.x
    // altNode.y = boundingRect.y
  } else {
    altNode.x = node.x
    altNode.y = node.y
  }

  altNode.width = node.width
  altNode.height = node.height
  altNode.rotation = node.rotation
  altNode.layoutAlign = node.layoutAlign
  altNode.layoutGrow = node.layoutGrow
}

const convertFrame = (altNode: AltFrameMixin, node: DefaultFrameMixin) => {
  altNode.layoutMode = node.layoutMode
  altNode.primaryAxisSizingMode = node.primaryAxisSizingMode
  altNode.counterAxisSizingMode = node.counterAxisSizingMode

  // Fix this: https://stackoverflow.com/questions/57859754/flexbox-space-between-but-center-if-one-element
  // It affects HTML, Tailwind, Flutter and possibly SwiftUI. So, let's be consistent.
  if (node.primaryAxisAlignItems === 'SPACE_BETWEEN' && node.children.length === 1) {
    altNode.primaryAxisAlignItems = 'CENTER'
  } else {
    altNode.primaryAxisAlignItems = node.primaryAxisAlignItems
  }
  // @ts-ignore
  altNode.counterAxisAlignItems = node.counterAxisAlignItems

  altNode.paddingLeft = node.paddingLeft
  altNode.paddingRight = node.paddingRight
  altNode.paddingTop = node.paddingTop
  altNode.paddingBottom = node.paddingBottom

  altNode.itemSpacing = node.itemSpacing
  altNode.layoutGrids = node.layoutGrids
  altNode.gridStyleId = node.gridStyleId
  altNode.clipsContent = node.clipsContent
  altNode.guides = node.guides
}

const convertGeometry = (altNode: AltGeometryMixin, node: GeometryMixin) => {
  altNode.fills = node.fills
  altNode.strokes = node.strokes
  // @ts-ignore
  altNode.strokeWeight = node.strokeWeight
  altNode.strokeMiterLimit = node.strokeMiterLimit
  altNode.strokeAlign = node.strokeAlign
  altNode.strokeCap = node.strokeCap
  altNode.strokeJoin = node.strokeJoin
  altNode.dashPattern = node.dashPattern
  altNode.fillStyleId = node.fillStyleId
  altNode.strokeStyleId = node.strokeStyleId
}

const convertBlend = (altNode: AltBlendMixin, node: BlendMixin & SceneNodeMixin) => {
  altNode.opacity = node.opacity
  altNode.blendMode = node.blendMode
  altNode.isMask = node.isMask
  altNode.effects = node.effects
  altNode.effectStyleId = node.effectStyleId

  altNode.visible = node.visible
}

const convertDefaultShape = (altNode: AltDefaultShapeMixin, node: DefaultShapeMixin) => {
  // opacity, visible
  convertBlend(altNode, node)

  // fills, strokes
  convertGeometry(altNode, node)

  // width, x, y
  convertLayout(altNode, node)
}

const convertCorner = (altNode: AltCornerMixin, node: CornerMixin) => {
  altNode.cornerRadius = node.cornerRadius
  altNode.cornerSmoothing = node.cornerSmoothing
}

const convertRectangleCorner = (altNode: AltRectangleCornerMixin, node: RectangleCornerMixin) => {
  altNode.topLeftRadius = node.topLeftRadius
  altNode.topRightRadius = node.topRightRadius
  altNode.bottomLeftRadius = node.bottomLeftRadius
  altNode.bottomRightRadius = node.bottomRightRadius
}

const convertIntoAltText = (altNode: AltTextNode, node: TextNode) => {
  altNode.textAlignHorizontal = node.textAlignHorizontal
  altNode.textAlignVertical = node.textAlignVertical
  altNode.paragraphIndent = node.paragraphIndent
  altNode.paragraphSpacing = node.paragraphSpacing
  altNode.fontSize = node.fontSize
  altNode.fontName = node.fontName
  altNode.textCase = node.textCase
  altNode.textDecoration = node.textDecoration
  altNode.letterSpacing = node.letterSpacing
  // @ts-ignore
  altNode.textAutoResize = node.textAutoResize
  altNode.characters = node.characters
  altNode.lineHeight = node.lineHeight
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

const applyMatrixToPoint = (matrix: number[][], point: number[]): number[] => {
  return [
    point[0] * matrix[0][0] + point[1] * matrix[0][1] + matrix[0][2],
    point[0] * matrix[1][0] + point[1] * matrix[1][1] + matrix[1][2],
  ]
}
