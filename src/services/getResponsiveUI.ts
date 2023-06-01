import { processFigmaNode } from './figma'

type Magic_Payload = {
  type: string
  data: any
}

export async function getResponsiveUI(node: Magic_Payload) {
  if (!node) {
    return
  }

  // TODO: Trasform all sources to a common format that should have at least:
  // width, height, x, y, layout and children

  const { type, data } = node

  if (type === 'figma') {
    return await processFigmaNode(data)
  }

  return 'No type found'
}
