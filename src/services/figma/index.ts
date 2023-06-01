import { convertIntoAltNodes } from './altConversion'

export async function processFigmaStructure(node) {
  console.log('node')

  const updatedNode = convertIntoAltNodes(node, null)
  console.log(updatedNode)

  return node
}
