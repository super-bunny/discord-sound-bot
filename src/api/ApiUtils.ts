import http from 'http'

export function responseWrapper(data: Object | any[], code: number = 200, message?: string) {
  const _code = http.STATUS_CODES[code] ? code : 500

  return {
    code: _code,
    message: message || http.STATUS_CODES[_code],
    data: _code >= 200 && _code < 300 ? data : undefined,
  }
}
