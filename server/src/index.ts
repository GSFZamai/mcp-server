import * as readline from 'node:readline';
import { stdin, stdout } from 'node:process';

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

const serverInfo = {
  name: 'Coffee Shop',
  version: '1.0.0',
};

const drinks = [
  {
    name: 'Latte',
    price: 5,
    description:
      'A latte is a coffee drink made with espresso and steamed milk.',
  },
  {
    name: 'Mocha',
    price: 6,
    description: 'A mocha is a coffee drink made with espresso and chocolate.',
  },
  {
    name: 'Flat White',
    price: 7,
    description:
      'A flat white is a coffee drink made with espresso and steamed milk.',
  },
];

const tools = [
  {
    name: 'getDrinkNames',
    description: 'Get the names of the drinks',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: (args: any) => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(drinks.map((drink) => drink.name)),
          },
        ],
      };
    },
  },
  {
    name: 'getDrinkDescription',
    description: 'Get the description of the drinks',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
      required: ['name'],
    },
    execute: (args: any) => {
      const drink = drinks.find((drink) => drink.name === args.name);
      if (drink) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(drink?.description),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: 'Bebida não encontrada',
          },
        ],
        isError: true,
      };
    },
  },
];

function sendResponse(id: number, result: object) {
  const response = {
    jsonrpc: '2.0',
    id,
    result,
  };

  console.log(JSON.stringify(response));
}

(async function main() {
  for await (const line of rl) {
    try {
      const json = JSON.parse(line);

      if (json.jsonrpc === '2.0') {
        if (json.method === 'initialize') {
          sendResponse(json.id, {
            protocolVersion: '2025-03-26',
            capabilities: {
              tools: {
                listChanged: true,
              },
            },
            serverInfo,
          });
        }
        if (json.method === 'tools/list') {
          sendResponse(json.id, {
            tools: tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
            })),
          });
        }
        if (json.method === 'tools/call') {
          const tool = tools.find((tool) => tool.name === json.params.name);
          if (tool) {
            const toolResponse = tool.execute(json.params.arguments);
            sendResponse(json.id, toolResponse);
          }
          sendResponse(json.id, {
            error: {
              code: -32602,
              message: `Tool ${json.params.name} does not exist`,
            },
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
})();
