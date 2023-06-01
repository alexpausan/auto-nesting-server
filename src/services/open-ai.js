// openai.js
import fetch from 'node-fetch'

const OPENAI_API_URL = 'https://api.openai.com/v1/completions'
const OPENAI_MODEL = 'babbage:ft-personal:2404-v17-2023-04-25-12-42-32'
const COMPLETION_CLOSING = '}]}'
const GPT_END_OF_COMPLETION = 'END'

const OPENAI_TOKEN = process.env.OPENAI_TOKEN

const payload = {
  model: OPENAI_MODEL,
  temperature: 0,
  max_tokens: 1000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  stop: [`${COMPLETION_CLOSING} ${GPT_END_OF_COMPLETION}`],
}

export async function makeOpenAICall(prompt) {
  payload.prompt = prompt

  if (!OPENAI_TOKEN) {
    console.log('No OpenAI API key found in .env file')
    return
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_TOKEN}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  return data.choices[0].text.trim()
}
