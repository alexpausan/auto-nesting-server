import { convertIntoAltNodes } from './altConversion'
import { AltSceneNode } from './altTypes'

export async function processFigmaNode(node: AltSceneNode) {
  const updatedNode = convertIntoAltNodes([node], null)

  return updatedNode
}
