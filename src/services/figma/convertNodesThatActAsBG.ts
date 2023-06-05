import { isFrameNode } from '@figma-plugin/helpers'
import { AltRectangleNode, AltFrameNode, AltGroupNode, AltSceneNode } from './altMixins'
import { convertToAutoLayout } from './convertToAutoLayout'

/**
 * Identify all nodes that are inside Rectangles and transform those Rectangles into Frames containing those nodes.
 */
export const convertNodesThatActAsBG = (
  node: AltFrameNode | AltGroupNode
): AltFrameNode | AltGroupNode => {
  if (node.children.length < 2) {
    return node
  }
  if (!node.id) {
    throw new Error('Node is missing an id! This error should only happen in tests.')
  }

  const colliding = retrieveCollidingItems(node.children)

  const parentsKeys = Object.keys(colliding)
  // start with all children. This is going to be filtered.
  let updatedChildren: Array<AltSceneNode> = [...node.children]

  parentsKeys.forEach((key) => {
    // dangerous cast, but this is always true
    const parentNode = node.children.find((child) => child.id === key) as AltRectangleNode

    // retrieve the position. Key should always be at the left side, so even when other items are removed, the index is kept the same.
    const indexPosition = updatedChildren.findIndex((d) => d.id === key)

    // filter the children to remove those that are being modified.
    updatedChildren = updatedChildren.filter(
      (child) => !colliding[key].map((d) => d.id).includes(child.id) && key !== child.id
    )

    const frameNode = convertRectangleToFrame(parentNode)

    // @TODO: when the soon-to-be-parent is larger than its parent, things get weird.
    // Happens, for example, when a large image is used in the background.
    // Should this be handled or is this something user should never do?

    frameNode.children = [...colliding[key]]
    colliding[key].forEach((d) => {
      // @ts-ignore
      d.parent = { id: frameNode.id, type: 'FRAME' }
      d.x = d.x - frameNode.x
      d.y = d.y - frameNode.y
    })

    // try to convert the children to AutoLayout, and insert back at updatedChildren.
    // updatedChildren.splice(indexPosition, 0, convertToAutoLayout(frameNode))
    updatedChildren.splice(indexPosition, 0, frameNode)
  })

  // if there is only one child, remove the parent
  if (updatedChildren.length === 1) {
    // @ts-ignore
    updatedChildren[0].parent = node.parent
    return updatedChildren[0] as AltFrameNode
  }

  if (updatedChildren.length > 1) {
    node.children = updatedChildren
  }

  // convert the resulting node to AutoLayout.
  // node = convertToAutoLayout(node)

  return node
}

const convertRectangleToFrame = (rect: AltRectangleNode) => {
  // if a Rect with elements inside were identified, extract this Rect
  // outer methods are going to use it.

  const frameNode = new AltFrameNode()

  // opacity should be ignored, else it will affect children
  const { type, opacity, ...rest } = rect
  Object.assign(frameNode, rest)

  frameNode.layoutMode = 'NONE'

  // @TODO: test for spacer elements
  // when invisible, add the layer but don't fill it;
  // Designer might use invisible layers for alignment.
  if (rect.visible !== false) {
    Object.assign(frameNode, retrieveFillProps(rect))
  }

  // inner Rectangle shall get a FIXED size
  frameNode.primaryAxisAlignItems = 'MIN'
  frameNode.counterAxisAlignItems = 'MIN'
  frameNode.primaryAxisSizingMode = 'FIXED'
  frameNode.counterAxisSizingMode = 'FIXED'

  return frameNode
}

const FILL_PROPS = ['fills', 'fillStyleId', 'strokes', 'strokeStyleId', 'effects', 'effectStyleId']

const retrieveFillProps = (node: AltRectangleNode) => {
  const props: Record<string, any> = {}
  FILL_PROPS.forEach((prop) => {
    if (node[prop]) {
      props[prop] = node[prop]
    }
  })
  return props
}

/**
 * Iterate over each Rectangle and check if it has any child on top.
 * This is O(n^2), but is optimized to only do j=i+1 until length, and avoid repeated entries.
 * A Node can only have a single parent. The order is defined by layer order.
 */
const retrieveCollidingItems = (
  children: ReadonlyArray<AltSceneNode>
): Record<string, Array<AltSceneNode>> => {
  const used: Record<string, boolean> = {}
  const groups: Record<string, Array<AltSceneNode>> = {}

  for (let i = 0; i < children.length - 1; i++) {
    const item1 = children[i]

    // ignore items that are not Rectangles
    if (item1.type !== 'VECTOR') {
      continue
    }

    for (let j = i + 1; j < children.length; j++) {
      const item2 = children[j]

      if (
        !used[item2.id] &&
        item1.x <= item2.x &&
        item1.y <= item2.y &&
        item1.x + item1.width >= item2.x + item2.width &&
        item1.y + item1.height >= item2.y + item2.height
      ) {
        if (!groups[item1.id]) {
          groups[item1.id] = [item2]
        } else {
          groups[item1.id].push(item2)
        }
        used[item2.id] = true
      }
    }
  }

  return groups
}
