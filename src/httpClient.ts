import * as https from 'https'

export class HttpResponse {
  public status: number | null = null
  public body?: string
  public error?: string

  get isOk() {
    return this.status === 200
  }

  get isFailed() {
    return !this.isOk
  }

  public response<T>(): undefined | T {
    if (this.body) {
      return JSON.parse(this.body) as T
    }
    return undefined
  }
}

enum HttpMethod {
  POST = 'POST'
}

export default class HttpClient {

  private default_headers = {
    'Content-Type': 'application/json',
    'Content-Length': 0,
    'Authorization': 'Bearer '
  }

  private api_key: string
  private base_url: string
  private timeout: number = 1000


  constructor(api_key: string, base_url: string) {
    this.api_key = api_key
    this.base_url = base_url
  }

  public post(url: string, data: object): Promise<HttpResponse> {
    return this.sendRequest(url, data, HttpMethod.POST)
  }

  private sendRequest(url: string, data: string | object, method: HttpMethod): Promise<HttpResponse> {

    return new Promise<HttpResponse>(resolve => {
      if (typeof data === "object") {
        data = JSON.stringify(data)
      }

      let response: HttpResponse = new HttpResponse
      let headers = this.default_headers
      headers["Content-Length"] = Buffer.byteLength(data, 'utf8')
      headers['Authorization'] = 'Bearer ' + this.api_key

      // the post options
      const optionspost = {
        host: this.base_url,
        port: 443,
        path: url,
        method: method,
        headers: headers
      }

      let request = https.request(optionspost, (res) => {
        response.status = res.statusCode ? res.statusCode : 500
        res.on('data', (body) => {
          response.body = body.toString()
          resolve(response)
        })
      })
      request.on('error', (e) => {
        console.error(e)
      });
      request.on('socket', (socket) => {
        socket.setTimeout(this.timeout)
        socket.on('timeout', () => {
          request.abort()
          response.error = 'socket timed out'
          resolve(response)
        });
      });
      request.on('timeout', () => {
        request.abort()
        response.error = 'request timed out'
        resolve(response)
      })

      // write the json data
      request.write(data)
      request.end()
    })
  }
}