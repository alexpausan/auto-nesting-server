import { AltRectangleNode, AltFrameNode, AltSceneNode } from './altTypes'
import { convertToAutoLayout } from './convertToAutoLayout'

/**
 * Identify all nodes that are inside Rectangles and transform those Rectangles into Frames containing those nodes.
 */
export const convertNodesThatActAsBG = (node: AltFrameNode): AltFrameNode => {
  const { children } = node

  if (children.length < 2) {
    return node
  }

  if (!node.id) {
    throw new Error('Node is missing an id! This error should only happen in tests.')
  }

  const { newParents, markedOnTopOfRectangles } = retrieveCollidingItems(children)

  const updatedChildren = children
    // First we keep only the children that are not markedOnTopOfRectangles
    .filter((child) => !markedOnTopOfRectangles[child.id])
    // Then we update the children that will be converted to frames
    .map((child) => {
      if (newParents[child.id]) {
        const newFrame = convertRectangleToFrame(child as AltRectangleNode)

        newFrame.parent = { id: child.parent.id, type: 'FRAME' } as AltFrameNode
        newFrame.children = newParents[child.id]

        // Update children's parent reference
        newFrame.children.forEach((child: AltFrameNode) => {
          child.parent = { id: newFrame.id, type: 'FRAME' } as AltFrameNode
          child.x = child.x - newFrame.x
          child.y = child.y - newFrame.y
        })

        // @TODO: when the soon-to-be-parent is larger than its parent, things get weird.
        // Happens, for example, when a large image is used in the background.
        // Should this be handled or is this something user should never do?

        return convertToAutoLayout(newFrame)
      }

      return child
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

  return node
}

type CollidingItems = {
  newParents: Record<string, Array<AltSceneNode>>
  markedOnTopOfRectangles: Record<string, boolean>
}

/**
 * Iterate over each Rectangle and check if it has any child on top.
 * This is O(n^2), but is optimized to only do j=i+1 until length, and avoid repeated entries.
 * A Node can only have a single parent.
 * The order is based on the items order in the UI, which deteremines visibility - but in reverse order.
 * Eg. Background first, then the elements on top.
 */
const retrieveCollidingItems = (children: ReadonlyArray<AltSceneNode>): CollidingItems => {
  const markedOnTop: Record<string, boolean> = {}
  const newParents: Record<string, Array<AltSceneNode>> = {}

  for (let i = 0; i < children.length - 1; i++) {
    const bgNode = children[i]

    // ignore items that are not Rectangles
    if (bgNode.type !== 'VECTOR') {
      continue
    }

    for (let j = i + 1; j < children.length; j++) {
      const topElement = children[j]

      if (
        !markedOnTop[topElement.id] &&
        bgNode.x <= topElement.x &&
        bgNode.y <= topElement.y &&
        bgNode.x + bgNode.width >= topElement.x + topElement.width &&
        bgNode.y + bgNode.height >= topElement.y + topElement.height
      ) {
        if (!newParents[bgNode.id]) {
          newParents[bgNode.id] = [topElement]
        } else {
          newParents[bgNode.id].push(topElement)
        }
        markedOnTop[topElement.id] = true
      }
    }
  }

  return {
    newParents,
    markedOnTopOfRectangles: markedOnTop,
  }
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
