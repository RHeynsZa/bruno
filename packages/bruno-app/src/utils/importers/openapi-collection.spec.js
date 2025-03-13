import { parseOpenApiCollection, updateOpenApiCollection } from './openapi-collection';
import { uuid } from 'utils/common';

jest.mock('utils/common');

describe('openapi importer util functions', () => {
  afterEach(jest.clearAllMocks);

  it('should convert openapi object to bruno collection correctly', async () => {
    const input = {
      openapi: '3.0.3',
      info: {
        title: 'Sample API with Multiple Servers',
        description: 'API spec with multiple servers.',
        version: '1.0.0'
      },
      servers: [
        { url: 'https://api.example.com/v1', description: 'Production Server' },
        { url: 'https://staging-api.example.com/v1', description: 'Staging Server' },
        { url: 'http://localhost:3000/v1', description: 'Local Server' }
      ],
      paths: {
        '/users': {
          get: {
            summary: 'Get a list of users',
            parameters: [
              { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
              { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }
            ],
            responses: {
              '200': { description: 'A list of users' }
            }
          }
        }
      }
    };

    const expectedOutput = {
      name: 'Sample API with Multiple Servers',
      version: '1',
      items: [
        {
          uid: expect.any(String),
          name: 'Get a list of users',
          type: 'http-request',
          request: {
            url: '{{baseUrl}}/users',
            method: 'GET',
            auth: {
              mode: 'none',
              basic: null,
              bearer: null,
              digest: null
            },
            headers: [],
            params: [
              { uid: expect.any(String), name: 'page', value: '', description: '', enabled: false, type: 'query' },
              { uid: expect.any(String), name: 'limit', value: '', description: '', enabled: false, type: 'query' }
            ],
            body: {
              mode: 'none',
              json: null,
              text: null,
              xml: null,
              formUrlEncoded: [],
              multipartForm: []
            },
            script: {
              res: null
            }
          }
        }
      ],
      environments: [
        {
          uid: expect.any(String),
          name: 'Production Server',
          variables: [
            { uid: expect.any(String), name: 'baseUrl', value: 'https://api.example.com/v1', type: 'text', enabled: true, secret: false }
          ]
        },
        {
          uid: expect.any(String),
          name: 'Staging Server',
          variables: [
            { uid: expect.any(String), name: 'baseUrl', value: 'https://staging-api.example.com/v1', type: 'text', enabled: true, secret: false }
          ]
        },
        {
          uid: expect.any(String),
          name: 'Local Server',
          variables: [
            { uid: expect.any(String), name: 'baseUrl', value: 'http://localhost:3000/v1', type: 'text', enabled: true, secret: false }
          ]
        }
      ]
    };

    const result = await parseOpenApiCollection(input);

    expect(result).toMatchObject(expectedOutput);
    expect(uuid).toHaveBeenCalledTimes(10);
  });

  it('should update an existing collection with changes from an updated OpenAPI spec', async () => {
    const existingCollection = {
      name: 'Sample API with Multiple Servers',
      version: '1',
      items: [
        {
          uid: 'existing-uid',
          name: 'Get a list of users',
          type: 'http-request',
          request: {
            url: '{{baseUrl}}/users',
            method: 'GET',
            auth: {
              mode: 'none',
              basic: null,
              bearer: null,
              digest: null
            },
            headers: [],
            params: [
              { uid: 'existing-param-uid', name: 'page', value: '', description: '', enabled: false, type: 'query' },
              { uid: 'existing-param-uid-2', name: 'limit', value: '', description: '', enabled: false, type: 'query' }
            ],
            body: {
              mode: 'none',
              json: null,
              text: null,
              xml: null,
              formUrlEncoded: [],
              multipartForm: []
            },
            script: {
              res: null
            }
          }
        }
      ],
      environments: [
        {
          uid: 'existing-env-uid',
          name: 'Production Server',
          variables: [
            { uid: 'existing-var-uid', name: 'baseUrl', value: 'https://api.example.com/v1', type: 'text', enabled: true, secret: false }
          ]
        }
      ]
    };

    const updatedSpec = {
      openapi: '3.0.3',
      info: {
        title: 'Sample API with Multiple Servers',
        description: 'API spec with multiple servers.',
        version: '1.0.0'
      },
      servers: [
        { url: 'https://api.example.com/v1', description: 'Production Server' }
      ],
      paths: {
        '/users': {
          get: {
            summary: 'Get a list of users',
            parameters: [
              { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
              { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }
            ],
            responses: {
              '200': { description: 'A list of users' }
            }
          }
        },
        '/users/{id}': {
          get: {
            summary: 'Get a user by ID',
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
            ],
            responses: {
              '200': { description: 'A user' }
            }
          }
        }
      }
    };

    const updatedCollection = await updateOpenApiCollection(existingCollection, updatedSpec);

    expect(updatedCollection.items).toHaveLength(2);
    expect(updatedCollection.environments).toHaveLength(1);
    expect(updatedCollection.environments[0].variables).toHaveLength(1);
    expect(updatedCollection.environments[0].variables[0].value).toBe('https://api.example.com/v1');
  });
});
