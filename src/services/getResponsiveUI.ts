import { processFigmaStructure } from './figma'

type Magic_Payload = {
  type: string
  data: any
}

export async function getResponsiveUI(node: Magic_Payload) {
  if (!node) {
    return
  }

  const { type, data } = node

  if (type === 'figma') {
    return await processFigmaStructure(data)
  }

  return 'No type found'
}
