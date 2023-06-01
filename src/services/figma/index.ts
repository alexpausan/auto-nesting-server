import { convertIntoAltNodes } from './altConversion'
import { AltSceneNode } from './altMixins'

export async function processFigmaNode(node: AltSceneNode) {
  const updatedNode = convertIntoAltNodes([node], null)

  return updatedNode
}
