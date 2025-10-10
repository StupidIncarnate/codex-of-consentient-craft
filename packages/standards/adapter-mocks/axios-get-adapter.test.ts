// Example 2: API Call - HTTP Client (axios) Mocking
// This demonstrates mocking external npm packages that make network requests

import { axiosGetAdapter } from './axios-get-adapter';
import { UrlStub } from '../../contracts/url/url.stub';
import { HttpResponseStub } from '../../contracts/http-response/http-response.stub';
import { httpResponseContract } from '../../contracts/http-response/http-response-contract';

// Mock the axios module
jest.mock('axios');
import axios from 'axios';
const mockAxios = jest.mocked(axios);

describe('axiosGetAdapter', () => {
  it('VALID: {url: "https://api.example.com/users"} => returns http response', async () => {
    // Arrange: Setup test data
    const url = UrlStub('https://api.example.com/users');
    const expectedResponse = HttpResponseStub({
      body: { users: ['John', 'Jane'] },
      statusCode: httpResponseContract.shape.statusCode.parse(200),
      headers: { 'content-type': 'application/json' },
    });

    // Mock axios.get to return AxiosResponse shape
    // Note: We return the full axios response structure, but our adapter
    // translates it to our HttpResponse contract
    mockAxios.get.mockResolvedValue({
      data: { users: ['John', 'Jane'] },
      status: 200,
      headers: { 'content-type': 'application/json' },
      statusText: 'OK',
      config: {},
    });

    // Act
    const result = await axiosGetAdapter({ url });

    // Assert: Test complete object structure
    expect(result).toStrictEqual(expectedResponse);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'QuestMaestro/1.0' },
    });
  });

  it('VALID: {url: "https://api.example.com/user/123"} => returns single user', async () => {
    const url = UrlStub('https://api.example.com/user/123');
    const expectedResponse = HttpResponseStub({
      body: { id: '123', name: 'John' },
      statusCode: httpResponseContract.shape.statusCode.parse(200),
      headers: { 'content-type': 'application/json' },
    });

    mockAxios.get.mockResolvedValue({
      data: { id: '123', name: 'John' },
      status: 200,
      headers: { 'content-type': 'application/json' },
      statusText: 'OK',
      config: {},
    });

    const result = await axiosGetAdapter({ url });

    expect(result).toStrictEqual(expectedResponse);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('ERROR: {url: "https://api.example.com/error"} => throws network error', async () => {
    const url = UrlStub('https://api.example.com/error');

    // Mock network failure
    mockAxios.get.mockRejectedValue(new Error('Network Error'));

    await expect(axiosGetAdapter({ url })).rejects.toThrow('Network Error');
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'QuestMaestro/1.0' },
    });
  });

  it('ERROR: {url: "https://api.example.com/timeout"} => throws timeout error', async () => {
    const url = UrlStub('https://api.example.com/timeout');

    mockAxios.get.mockRejectedValue(new Error('timeout of 10000ms exceeded'));

    await expect(axiosGetAdapter({ url })).rejects.toThrow('timeout of 10000ms exceeded');
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });
});
