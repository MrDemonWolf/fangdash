// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// ../../node_modules/.pnpm/hono@4.11.3/node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// src/worker/types.ts
function getManifest(env) {
  try {
    const parsed = JSON.parse(env.LOCALFLARE_MANIFEST || "{}");
    return {
      ...parsed,
      vars: parsed.vars || []
    };
  } catch {
    return { name: "worker", d1: [], kv: [], r2: [], queues: { producers: [], consumers: [] }, do: [], vars: [] };
  }
}
function isD1Database(binding) {
  return binding !== null && typeof binding === "object" && "prepare" in binding && typeof binding.prepare === "function";
}
function isKVNamespace(binding) {
  return binding !== null && typeof binding === "object" && "get" in binding && "put" in binding && "list" in binding;
}
function isR2Bucket(binding) {
  return binding !== null && typeof binding === "object" && "get" in binding && "put" in binding && "list" in binding && "head" in binding;
}
function isQueue(binding) {
  return binding !== null && typeof binding === "object" && "send" in binding && "sendBatch" in binding;
}

// src/worker/routes/bindings.ts
function createBindingsRoutes() {
  const app2 = new Hono2();
  app2.get("/", async (c) => {
    const manifest = getManifest(c.env);
    return c.json({
      name: manifest.name || "worker",
      bindings: {
        d1: manifest.d1.map((db) => ({
          type: "d1",
          binding: db.binding,
          database_name: db.database_name
        })),
        kv: manifest.kv.map((kv) => ({
          type: "kv",
          binding: kv.binding
        })),
        r2: manifest.r2.map((r2) => ({
          type: "r2",
          binding: r2.binding,
          bucket_name: r2.bucket_name
        })),
        durableObjects: manifest.do.map((doConfig) => ({
          type: "durable_object",
          name: doConfig.binding,
          binding: doConfig.binding,
          class_name: doConfig.className
        })),
        queues: {
          producers: manifest.queues.producers.map((p) => ({
            type: "queue_producer",
            binding: p.binding,
            queue: p.queue
          })),
          consumers: manifest.queues.consumers.map((consumer) => ({
            type: "queue_consumer",
            queue: consumer.queue
          }))
        },
        vars: (manifest.vars || []).map((v) => ({
          type: "var",
          key: v.key,
          value: v.isSecret ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : v.value,
          isSecret: v.isSecret
        }))
      }
    });
  });
  return app2;
}

// src/worker/routes/d1.ts
function createD1Routes() {
  const app2 = new Hono2();
  function getDatabase(env, binding) {
    const db = env[binding];
    if (isD1Database(db)) {
      return db;
    }
    return null;
  }
  function escapeIdentifier(name) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  async function getPrimaryKeys(db, tableName) {
    const result = await db.prepare(`PRAGMA table_info(${escapeIdentifier(tableName)})`).all();
    return result.results.filter((col) => col.pk > 0).sort((a, b) => a.pk - b.pk).map((col) => col.name);
  }
  function buildPrimaryKeyWhere(primaryKeys, rowId) {
    if (typeof rowId === "string" && rowId.startsWith("[")) {
      try {
        const keyValues = JSON.parse(rowId);
        const conditions = primaryKeys.map((pk) => `${escapeIdentifier(pk)} = ?`);
        return { clause: conditions.join(" AND "), values: keyValues };
      } catch {
      }
    }
    if (typeof rowId === "object" && rowId !== null) {
      const conditions = primaryKeys.map((pk) => `${escapeIdentifier(pk)} = ?`);
      const values = primaryKeys.map((pk) => rowId[pk]);
      return { clause: conditions.join(" AND "), values };
    }
    if (primaryKeys.length === 1) {
      return {
        clause: `${escapeIdentifier(primaryKeys[0])} = ?`,
        values: [rowId]
      };
    }
    throw new Error("Invalid row identifier for composite primary key");
  }
  app2.get("/", async (c) => {
    const manifest = getManifest(c.env);
    return c.json({
      databases: manifest.d1.map((db) => ({
        binding: db.binding,
        database_name: db.database_name
      }))
    });
  });
  app2.get("/:binding/schema", async (c) => {
    const db = getDatabase(c.env, c.req.param("binding"));
    if (!db) {
      return c.json({ error: "Database not found" }, 404);
    }
    try {
      const result = await db.prepare(
        `SELECT name, sql FROM sqlite_master
         WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE '_mf_%'
         ORDER BY name`
      ).all();
      return c.json({ tables: result.results });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.get("/:binding/tables/:table", async (c) => {
    const db = getDatabase(c.env, c.req.param("binding"));
    if (!db) {
      return c.json({ error: "Database not found" }, 404);
    }
    try {
      const tableName = c.req.param("table");
      const escapedTable = escapeIdentifier(tableName);
      const [columnsResult, countResult, indexesResult, foreignKeysResult] = await Promise.all([
        // Column info
        db.prepare(`PRAGMA table_info(${escapedTable})`).all(),
        // Row count
        db.prepare(`SELECT COUNT(*) as count FROM ${escapedTable}`).first(),
        // Index info
        db.prepare(`PRAGMA index_list(${escapedTable})`).all(),
        // Foreign key info
        db.prepare(`PRAGMA foreign_key_list(${escapedTable})`).all()
      ]);
      const columns = columnsResult.results;
      const primaryKeys = columns.filter((col) => col.pk > 0).sort((a, b) => a.pk - b.pk).map((col) => col.name);
      return c.json({
        table: tableName,
        columns: columnsResult.results,
        primaryKeys,
        indexes: indexesResult.results,
        foreignKeys: foreignKeysResult.results,
        rowCount: countResult?.count ?? 0
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.get("/:binding/tables/:table/rows", async (c) => {
    const db = getDatabase(c.env, c.req.param("binding"));
    if (!db) {
      return c.json({ error: "Database not found" }, 404);
    }
    try {
      const tableName = c.req.param("table");
      const escapedTable = escapeIdentifier(tableName);
      const limit = Math.min(Number(c.req.query("limit")) || 50, 1e3);
      const offset = Number(c.req.query("offset")) || 0;
      const sortColumn = c.req.query("sort");
      const sortDirection = c.req.query("dir")?.toUpperCase() === "DESC" ? "DESC" : "ASC";
      let sql = `SELECT * FROM ${escapedTable}`;
      if (sortColumn) {
        sql += ` ORDER BY ${escapeIdentifier(sortColumn)} ${sortDirection}`;
      }
      sql += ` LIMIT ? OFFSET ?`;
      const result = await db.prepare(sql).bind(limit, offset).all();
      return c.json({
        rows: result.results,
        meta: {
          limit,
          offset,
          duration: result.meta?.duration
        }
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.post("/:binding/query", async (c) => {
    const db = getDatabase(c.env, c.req.param("binding"));
    if (!db) {
      return c.json({ error: "Database not found" }, 404);
    }
    try {
      const { sql, params = [] } = await c.req.json();
      if (!sql) {
        return c.json({ error: "SQL query is required" }, 400);
      }
      const trimmedSql = sql.trim().toUpperCase();
      const isRead = trimmedSql.startsWith("SELECT") || trimmedSql.startsWith("PRAGMA") || trimmedSql.startsWith("EXPLAIN");
      const stmt = db.prepare(sql);
      const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
      if (isRead) {
        const result = await boundStmt.all();
        return c.json({
          success: true,
          results: result.results,
          rowCount: result.results?.length ?? 0,
          meta: {
            changes: 0,
            duration: result.meta?.duration
          }
        });
      } else {
        const result = await boundStmt.run();
        return c.json({
          success: true,
          meta: {
            changes: result.meta?.changes ?? 0,
            last_row_id: result.meta?.last_row_id,
            duration: result.meta?.duration
          }
        });
      }
    } catch (error) {
      return c.json({ error: String(error), success: false }, 500);
    }
  });
  app2.post("/:binding/tables/:table/rows", async (c) => {
    const db = getDatabase(c.env, c.req.param("binding"));
    if (!db) {
      return c.json({ error: "Database not found" }, 404);
    }
    try {
      const tableName = c.req.param("table");
      const data = await c.req.json();
      const entries = Object.entries(data).filter(([_, v]) => v !== void 0);
      const columns = entries.map(([k]) => escapeIdentifier(k));
      const values = entries.map(([_, v]) => v);
      const placeholders = columns.map(() => "?").join(", ");
      if (columns.length === 0) {
        return c.json({ error: "No data provided" }, 400);
      }
      const sql = `INSERT INTO ${escapeIdentifier(tableName)} (${columns.join(", ")}) VALUES (${placeholders})`;
      const result = await db.prepare(sql).bind(...values).run();
      return c.json({
        success: true,
        meta: {
          changes: result.meta?.changes ?? 0,
          last_row_id: result.meta?.last_row_id,
          duration: result.meta?.duration
        }
      });
    } catch (error) {
      return c.json({ error: String(error), success: false }, 500);
    }
  });
  app2.put("/:binding/tables/:table/rows/:rowId", async (c) => {
    const db = getDatabase(c.env, c.req.param("binding"));
    if (!db) {
      return c.json({ error: "Database not found" }, 404);
    }
    try {
      const tableName = c.req.param("table");
      const rowId = c.req.param("rowId");
      const data = await c.req.json();
      const primaryKeys = await getPrimaryKeys(db, tableName);
      if (primaryKeys.length === 0) {
        return c.json({ error: "Table has no primary key" }, 400);
      }
      const { clause: whereClause, values: whereValues } = buildPrimaryKeyWhere(primaryKeys, rowId);
      const updateEntries = Object.entries(data).filter(
        ([k]) => !primaryKeys.includes(k)
      );
      if (updateEntries.length === 0) {
        return c.json({ error: "No data to update" }, 400);
      }
      const setClause = updateEntries.map(([k]) => `${escapeIdentifier(k)} = ?`).join(", ");
      const updateValues = updateEntries.map(([_, v]) => v);
      const sql = `UPDATE ${escapeIdentifier(tableName)} SET ${setClause} WHERE ${whereClause}`;
      const result = await db.prepare(sql).bind(...updateValues, ...whereValues).run();
      return c.json({
        success: true,
        meta: {
          changes: result.meta?.changes ?? 0,
          duration: result.meta?.duration
        }
      });
    } catch (error) {
      return c.json({ error: String(error), success: false }, 500);
    }
  });
  app2.patch("/:binding/tables/:table/rows/:rowId", async (c) => {
    const db = getDatabase(c.env, c.req.param("binding"));
    if (!db) {
      return c.json({ error: "Database not found" }, 404);
    }
    try {
      const tableName = c.req.param("table");
      const rowId = c.req.param("rowId");
      const { column, value } = await c.req.json();
      if (!column) {
        return c.json({ error: "Column name is required" }, 400);
      }
      const primaryKeys = await getPrimaryKeys(db, tableName);
      if (primaryKeys.length === 0) {
        return c.json({ error: "Table has no primary key" }, 400);
      }
      const { clause: whereClause, values: whereValues } = buildPrimaryKeyWhere(primaryKeys, rowId);
      const sql = `UPDATE ${escapeIdentifier(tableName)} SET ${escapeIdentifier(column)} = ? WHERE ${whereClause}`;
      const result = await db.prepare(sql).bind(value, ...whereValues).run();
      return c.json({
        success: true,
        meta: {
          changes: result.meta?.changes ?? 0,
          duration: result.meta?.duration
        }
      });
    } catch (error) {
      return c.json({ error: String(error), success: false }, 500);
    }
  });
  app2.delete("/:binding/tables/:table/rows/:rowId", async (c) => {
    const db = getDatabase(c.env, c.req.param("binding"));
    if (!db) {
      return c.json({ error: "Database not found" }, 404);
    }
    try {
      const tableName = c.req.param("table");
      const rowId = c.req.param("rowId");
      const primaryKeys = await getPrimaryKeys(db, tableName);
      if (primaryKeys.length === 0) {
        return c.json({ error: "Table has no primary key" }, 400);
      }
      const { clause: whereClause, values: whereValues } = buildPrimaryKeyWhere(primaryKeys, rowId);
      const sql = `DELETE FROM ${escapeIdentifier(tableName)} WHERE ${whereClause}`;
      const result = await db.prepare(sql).bind(...whereValues).run();
      return c.json({
        success: true,
        meta: {
          changes: result.meta?.changes ?? 0,
          duration: result.meta?.duration
        }
      });
    } catch (error) {
      return c.json({ error: String(error), success: false }, 500);
    }
  });
  app2.post("/:binding/tables/:table/bulk-delete", async (c) => {
    const db = getDatabase(c.env, c.req.param("binding"));
    if (!db) {
      return c.json({ error: "Database not found" }, 404);
    }
    try {
      const tableName = c.req.param("table");
      const { rowIds } = await c.req.json();
      if (!rowIds || rowIds.length === 0) {
        return c.json({ error: "No row IDs provided" }, 400);
      }
      const primaryKeys = await getPrimaryKeys(db, tableName);
      if (primaryKeys.length === 0) {
        return c.json({ error: "Table has no primary key" }, 400);
      }
      const statements = [];
      for (const rowId of rowIds) {
        const { clause: whereClause, values: whereValues } = buildPrimaryKeyWhere(primaryKeys, rowId);
        const sql = `DELETE FROM ${escapeIdentifier(tableName)} WHERE ${whereClause}`;
        statements.push(db.prepare(sql).bind(...whereValues));
      }
      const results = await db.batch(statements);
      let totalChanges = 0;
      for (const r of results) {
        totalChanges += r.meta?.changes ?? 0;
      }
      return c.json({
        success: true,
        meta: {
          changes: totalChanges,
          rowsProcessed: rowIds.length
        }
      });
    } catch (error) {
      return c.json({ error: String(error), success: false }, 500);
    }
  });
  app2.post("/:binding/tables/:table/bulk-update", async (c) => {
    const db = getDatabase(c.env, c.req.param("binding"));
    if (!db) {
      return c.json({ error: "Database not found" }, 404);
    }
    try {
      const tableName = c.req.param("table");
      const { rowIds, data } = await c.req.json();
      if (!rowIds || rowIds.length === 0) {
        return c.json({ error: "No row IDs provided" }, 400);
      }
      if (!data || Object.keys(data).length === 0) {
        return c.json({ error: "No data provided" }, 400);
      }
      const primaryKeys = await getPrimaryKeys(db, tableName);
      if (primaryKeys.length === 0) {
        return c.json({ error: "Table has no primary key" }, 400);
      }
      const updateEntries = Object.entries(data).filter(
        ([k]) => !primaryKeys.includes(k)
      );
      if (updateEntries.length === 0) {
        return c.json({ error: "No data to update (only primary key columns provided)" }, 400);
      }
      const setClause = updateEntries.map(([k]) => `${escapeIdentifier(k)} = ?`).join(", ");
      const updateValues = updateEntries.map(([_, v]) => v);
      const statements = [];
      for (const rowId of rowIds) {
        const { clause: whereClause, values: whereValues } = buildPrimaryKeyWhere(primaryKeys, rowId);
        const sql = `UPDATE ${escapeIdentifier(tableName)} SET ${setClause} WHERE ${whereClause}`;
        statements.push(db.prepare(sql).bind(...updateValues, ...whereValues));
      }
      const results = await db.batch(statements);
      let totalChanges = 0;
      for (const r of results) {
        totalChanges += r.meta?.changes ?? 0;
      }
      return c.json({
        success: true,
        meta: {
          changes: totalChanges,
          rowsProcessed: rowIds.length
        }
      });
    } catch (error) {
      return c.json({ error: String(error), success: false }, 500);
    }
  });
  return app2;
}

// src/worker/routes/kv.ts
function createKVRoutes() {
  const app2 = new Hono2();
  function getKV(env, binding) {
    const kv = env[binding];
    if (isKVNamespace(kv)) {
      return kv;
    }
    return null;
  }
  app2.get("/", async (c) => {
    const manifest = getManifest(c.env);
    return c.json({
      namespaces: manifest.kv.map((kv) => ({
        binding: kv.binding,
        id: kv.binding
      }))
    });
  });
  app2.get("/:binding/keys", async (c) => {
    const kv = getKV(c.env, c.req.param("binding"));
    if (!kv) {
      return c.json({ error: "Namespace not found" }, 404);
    }
    try {
      const prefix = c.req.query("prefix") || void 0;
      const limit = Number(c.req.query("limit")) || 100;
      const cursor = c.req.query("cursor") || void 0;
      const result = await kv.list({
        prefix,
        limit,
        cursor
      });
      return c.json({
        keys: result.keys.map((key) => ({
          name: key.name,
          expiration: key.expiration,
          metadata: key.metadata
        })),
        cursor: result.cursor || void 0,
        list_complete: result.list_complete
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.get("/:binding/keys/:key", async (c) => {
    const kv = getKV(c.env, c.req.param("binding"));
    if (!kv) {
      return c.json({ error: "Namespace not found" }, 404);
    }
    try {
      const key = c.req.param("key");
      const type = c.req.query("type") || "text";
      const { value, metadata } = await kv.getWithMetadata(key, {
        type: type === "json" ? "json" : type === "arrayBuffer" ? "arrayBuffer" : "text"
      });
      if (value === null) {
        return c.json({ error: "Key not found" }, 404);
      }
      let responseValue = value;
      if (type === "arrayBuffer" && value instanceof ArrayBuffer) {
        responseValue = btoa(String.fromCharCode(...new Uint8Array(value)));
      }
      return c.json({
        key,
        value: responseValue,
        metadata
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.put("/:binding/keys/:key", async (c) => {
    const kv = getKV(c.env, c.req.param("binding"));
    if (!kv) {
      return c.json({ error: "Namespace not found" }, 404);
    }
    try {
      const key = c.req.param("key");
      const body = await c.req.json();
      await kv.put(key, body.value, {
        metadata: body.metadata,
        expirationTtl: body.expirationTtl,
        expiration: body.expiration
      });
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.delete("/:binding/keys/:key", async (c) => {
    const kv = getKV(c.env, c.req.param("binding"));
    if (!kv) {
      return c.json({ error: "Namespace not found" }, 404);
    }
    try {
      const key = c.req.param("key");
      await kv.delete(key);
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.post("/:binding/bulk-delete", async (c) => {
    const kv = getKV(c.env, c.req.param("binding"));
    if (!kv) {
      return c.json({ error: "Namespace not found" }, 404);
    }
    try {
      const { keys } = await c.req.json();
      await Promise.all(keys.map((key) => kv.delete(key)));
      return c.json({ success: true, deleted: keys.length });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  return app2;
}

// src/worker/routes/r2.ts
function createR2Routes() {
  const app2 = new Hono2();
  function getR2(env, binding) {
    const r2 = env[binding];
    if (isR2Bucket(r2)) {
      return r2;
    }
    return null;
  }
  app2.get("/", async (c) => {
    const manifest = getManifest(c.env);
    return c.json({
      buckets: manifest.r2.map((r2) => ({
        binding: r2.binding,
        bucket_name: r2.bucket_name
      }))
    });
  });
  app2.get("/:binding/objects", async (c) => {
    const r2 = getR2(c.env, c.req.param("binding"));
    if (!r2) {
      return c.json({ error: "Bucket not found" }, 404);
    }
    try {
      const prefix = c.req.query("prefix") || void 0;
      const limit = Number(c.req.query("limit")) || 100;
      const cursor = c.req.query("cursor") || void 0;
      const delimiter = c.req.query("delimiter") || void 0;
      const result = await r2.list({
        prefix,
        limit,
        cursor,
        delimiter
      });
      return c.json({
        objects: result.objects.map((obj) => ({
          key: obj.key,
          size: obj.size,
          etag: obj.etag,
          httpEtag: obj.httpEtag,
          uploaded: obj.uploaded.toISOString(),
          checksums: obj.checksums,
          customMetadata: obj.customMetadata
        })),
        truncated: result.truncated,
        cursor: result.cursor || void 0,
        delimitedPrefixes: result.delimitedPrefixes
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.get("/:binding/objects/:key{.+}/meta", async (c) => {
    const r2 = getR2(c.env, c.req.param("binding"));
    if (!r2) {
      return c.json({ error: "Bucket not found" }, 404);
    }
    try {
      const key = c.req.param("key");
      const head = await r2.head(key);
      if (!head) {
        return c.json({ error: "Object not found" }, 404);
      }
      return c.json({
        key: head.key,
        size: head.size,
        etag: head.etag,
        httpEtag: head.httpEtag,
        uploaded: head.uploaded.toISOString(),
        checksums: head.checksums,
        httpMetadata: head.httpMetadata,
        customMetadata: head.customMetadata
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.get("/:binding/objects/:key{.+}", async (c) => {
    const r2 = getR2(c.env, c.req.param("binding"));
    if (!r2) {
      return c.json({ error: "Bucket not found" }, 404);
    }
    try {
      const key = c.req.param("key");
      const object = await r2.get(key);
      if (!object) {
        return c.json({ error: "Object not found" }, 404);
      }
      const headers = new Headers();
      headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
      headers.set("ETag", object.httpEtag);
      headers.set("Content-Length", String(object.size));
      if (object.httpMetadata?.contentDisposition) {
        headers.set("Content-Disposition", object.httpMetadata.contentDisposition);
      }
      return new Response(object.body, { headers });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.put("/:binding/objects/:key{.+}", async (c) => {
    const r2 = getR2(c.env, c.req.param("binding"));
    if (!r2) {
      return c.json({ error: "Bucket not found" }, 404);
    }
    try {
      const key = c.req.param("key");
      const contentType = c.req.header("Content-Type") || "application/octet-stream";
      const body = c.req.raw.body;
      const customMetadata = {};
      c.req.raw.headers.forEach((value, headerKey) => {
        if (headerKey.toLowerCase().startsWith("x-amz-meta-")) {
          const metaKey = headerKey.slice(11);
          customMetadata[metaKey] = value;
        }
      });
      const result = await r2.put(key, body, {
        httpMetadata: { contentType },
        customMetadata: Object.keys(customMetadata).length > 0 ? customMetadata : void 0
      });
      return c.json({
        success: true,
        key: result.key,
        size: result.size,
        etag: result.etag
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.delete("/:binding/objects/:key{.+}", async (c) => {
    const r2 = getR2(c.env, c.req.param("binding"));
    if (!r2) {
      return c.json({ error: "Bucket not found" }, 404);
    }
    try {
      const key = c.req.param("key");
      await r2.delete(key);
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.post("/:binding/bulk-delete", async (c) => {
    const r2 = getR2(c.env, c.req.param("binding"));
    if (!r2) {
      return c.json({ error: "Bucket not found" }, 404);
    }
    try {
      const { keys } = await c.req.json();
      await r2.delete(keys);
      return c.json({ success: true, deleted: keys.length });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  return app2;
}

// src/worker/routes/queues.ts
function createQueuesRoutes() {
  const app2 = new Hono2();
  function getQueue(env, binding) {
    const queue = env[binding];
    if (isQueue(queue)) {
      return queue;
    }
    return null;
  }
  app2.get("/", async (c) => {
    const manifest = getManifest(c.env);
    return c.json({
      producers: manifest.queues.producers.map((p) => ({
        binding: p.binding,
        queue: p.queue
      })),
      consumers: manifest.queues.consumers.map((consumer) => ({
        queue: consumer.queue,
        max_batch_size: consumer.max_batch_size ?? 10,
        max_batch_timeout: consumer.max_batch_timeout ?? 5,
        max_retries: consumer.max_retries ?? 3,
        dead_letter_queue: consumer.dead_letter_queue
      }))
    });
  });
  app2.post("/:binding/send", async (c) => {
    const queue = getQueue(c.env, c.req.param("binding"));
    if (!queue) {
      return c.json({ error: "Queue not found" }, 404);
    }
    try {
      const { message } = await c.req.json();
      if (message === void 0) {
        return c.json({ error: "Message is required" }, 400);
      }
      await queue.send(message);
      return c.json({
        success: true,
        message: "Message sent! Check your terminal for consumer output."
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.post("/:binding/send-batch", async (c) => {
    const queue = getQueue(c.env, c.req.param("binding"));
    if (!queue) {
      return c.json({ error: "Queue not found" }, 404);
    }
    try {
      const { messages } = await c.req.json();
      if (!Array.isArray(messages) || messages.length === 0) {
        return c.json({ error: "Messages array is required and must not be empty" }, 400);
      }
      const batch = messages.map((msg) => ({ body: msg }));
      await queue.sendBatch(batch);
      return c.json({
        success: true,
        count: messages.length,
        message: `${messages.length} message(s) sent! Check your terminal for consumer output.`
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  return app2;
}

// src/worker/routes/do.ts
function createDORoutes() {
  const app2 = new Hono2();
  app2.get("/", async (c) => {
    const manifest = getManifest(c.env);
    return c.json({
      durableObjects: manifest.do.map((doConfig) => ({
        binding: doConfig.binding,
        class_name: doConfig.className
      })),
      hint: "Durable Object storage inspection requires the DO to expose a storage endpoint."
    });
  });
  app2.post("/:binding/id", async (c) => {
    const binding = c.req.param("binding");
    const manifest = getManifest(c.env);
    const doConfig = manifest.do.find((d) => d.binding === binding);
    if (!doConfig) {
      return c.json({ error: "Durable Object binding not found" }, 404);
    }
    const namespace = c.env[binding];
    if (!namespace || typeof namespace !== "object" || !("idFromName" in namespace)) {
      return c.json({ error: "Durable Object namespace not available" }, 404);
    }
    try {
      const body = await c.req.json();
      if (body.id) {
        const doId = namespace.idFromString(body.id);
        return c.json({ id: doId.toString() });
      } else if (body.name) {
        const doId = namespace.idFromName(body.name);
        return c.json({ id: doId.toString() });
      } else {
        const doId = namespace.newUniqueId();
        return c.json({ id: doId.toString() });
      }
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.get("/:binding/instances", async (c) => {
    const binding = c.req.param("binding");
    const manifest = getManifest(c.env);
    const doConfig = manifest.do.find((d) => d.binding === binding);
    if (!doConfig) {
      return c.json({ error: "Durable Object binding not found" }, 404);
    }
    const namespace = c.env[binding];
    if (!namespace || typeof namespace !== "object" || !("idFromName" in namespace)) {
      return c.json({ error: "Durable Object namespace not available" }, 404);
    }
    return c.json({
      binding: doConfig.binding,
      className: doConfig.className,
      hint: "Cannot list instances directly. Use idFromName() or idFromString() to get specific instances."
    });
  });
  app2.all("/:binding/:instanceId/fetch/*", async (c) => {
    const binding = c.req.param("binding");
    const instanceId = c.req.param("instanceId");
    const namespace = c.env[binding];
    if (!namespace || typeof namespace !== "object" || !("idFromName" in namespace)) {
      return c.json({ error: "Durable Object namespace not available" }, 404);
    }
    try {
      let id;
      try {
        id = namespace.idFromString(instanceId);
      } catch {
        id = namespace.idFromName(instanceId);
      }
      const stub = namespace.get(id);
      const path = c.req.path.split("/fetch/")[1] || "";
      const url = new URL(`https://do-stub/${path}`);
      const response = await stub.fetch(url.toString(), {
        method: c.req.method,
        headers: c.req.raw.headers,
        body: c.req.method !== "GET" && c.req.method !== "HEAD" ? c.req.raw.body : void 0
      });
      return response;
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
  app2.get("/:binding/:instanceId/storage", async (c) => {
    const binding = c.req.param("binding");
    const instanceId = c.req.param("instanceId");
    const namespace = c.env[binding];
    if (!namespace || typeof namespace !== "object" || !("idFromName" in namespace)) {
      return c.json({ error: "Durable Object namespace not available" }, 404);
    }
    try {
      let id;
      try {
        id = namespace.idFromString(instanceId);
      } catch {
        id = namespace.idFromName(instanceId);
      }
      const stub = namespace.get(id);
      const response = await stub.fetch("https://do-stub/storage", {
        method: "GET"
      });
      if (response.ok) {
        const data = await response.json();
        return c.json(data);
      }
      return c.json({
        error: "Storage inspection not available",
        hint: "The Durable Object does not expose a /storage endpoint. Add a handler for GET /storage in your DO to enable this feature.",
        status: response.status
      }, 501);
    } catch (error) {
      return c.json({
        error: String(error),
        hint: "To inspect DO storage, add a /storage endpoint to your Durable Object that returns storage.list() results."
      }, 500);
    }
  });
  return app2;
}

// src/worker/utils/request-store.ts
var MAX_REQUESTS = 500;
var MAX_LOGS = 1e3;
var MAX_BODY_SIZE = 100 * 1024;
var requests = [];
var logs = [];
var subscribers = /* @__PURE__ */ new Set();
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
function broadcast(event, data) {
  for (const subscriber of subscribers) {
    try {
      subscriber(event, data);
    } catch {
    }
  }
}
var requestStore = {
  /**
   * Capture a request before proxying
   */
  startRequest(req) {
    const id = generateId();
    const url = new URL(req.url);
    const captured = {
      id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      method: req.method,
      url: req.url,
      path: url.pathname + url.search,
      headers: Object.fromEntries(req.headers.entries())
    };
    requests.push(captured);
    if (requests.length > MAX_REQUESTS) {
      requests = requests.slice(-MAX_REQUESTS);
    }
    return id;
  },
  /**
   * Complete a request with response data
   */
  async completeRequest(id, response, startTime, captureBody = true) {
    const request = requests.find((r) => r.id === id);
    if (!request) return;
    let body;
    if (captureBody && response.body) {
      try {
        const cloned = response.clone();
        const buffer = await cloned.arrayBuffer();
        if (buffer.byteLength <= MAX_BODY_SIZE) {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json") || contentType.includes("text/") || contentType.includes("javascript")) {
            body = new TextDecoder().decode(buffer);
          } else {
            body = `[Binary data: ${buffer.byteLength} bytes]`;
          }
        } else {
          body = `[Response too large: ${buffer.byteLength} bytes]`;
        }
      } catch {
        body = "[Could not read body]";
      }
    }
    request.response = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      duration: Date.now() - startTime
    };
    broadcast("request", request);
    const logEntry = {
      id: generateId(),
      timestamp: request.timestamp,
      level: response.status >= 400 ? "error" : "info",
      source: "request",
      message: `${request.method} ${request.path} \u2192 ${response.status} (${request.response.duration}ms)`,
      data: {
        requestId: id,
        method: request.method,
        path: request.path,
        status: response.status,
        duration: request.response.duration
      }
    };
    logStore.add(logEntry);
  },
  /**
   * Get all captured requests
   */
  getAll() {
    return [...requests];
  },
  /**
   * Get a specific request by ID
   */
  get(id) {
    return requests.find((r) => r.id === id);
  },
  /**
   * Clear all requests
   */
  clear() {
    requests = [];
  }
};
var logStore = {
  /**
   * Add a log entry
   */
  add(entry) {
    logs.push(entry);
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(-MAX_LOGS);
    }
    broadcast("log", entry);
  },
  /**
   * Add a simple log message
   */
  log(level, message, data, source = "system") {
    const entry = {
      id: generateId(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      source,
      message,
      data
    };
    this.add(entry);
  },
  /**
   * Get all logs
   */
  getAll() {
    return [...logs];
  },
  /**
   * Get recent logs with limit
   */
  getRecent(limit = 100) {
    return logs.slice(-limit);
  },
  /**
   * Clear all logs
   */
  clear() {
    logs = [];
  }
};
var sseManager = {
  /**
   * Subscribe to events
   */
  subscribe(callback) {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  },
  /**
   * Create an SSE stream response
   */
  createStream() {
    const encoder = new TextEncoder();
    let controller = null;
    let unsubscribe = null;
    const stream = new ReadableStream({
      start(ctrl) {
        controller = ctrl;
        const initMsg = `event: connected
data: ${JSON.stringify({ timestamp: (/* @__PURE__ */ new Date()).toISOString() })}

`;
        controller.enqueue(encoder.encode(initMsg));
        unsubscribe = sseManager.subscribe((event, data) => {
          if (controller) {
            const msg = `event: ${event}
data: ${JSON.stringify(data)}

`;
            try {
              controller.enqueue(encoder.encode(msg));
            } catch {
            }
          }
        });
      },
      cancel() {
        if (unsubscribe) {
          unsubscribe();
        }
      }
    });
    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
    return {
      response,
      close: () => {
        if (unsubscribe) {
          unsubscribe();
        }
        if (controller) {
          try {
            controller.close();
          } catch {
          }
        }
      }
    };
  }
};

// src/worker/routes/logs.ts
function createLogsRoutes() {
  const app2 = new Hono2();
  app2.get("/", (c) => {
    const limit = parseInt(c.req.query("limit") || "100");
    const logs2 = logStore.getRecent(limit);
    return c.json({ logs: logs2 });
  });
  app2.delete("/", (c) => {
    logStore.clear();
    return c.json({ success: true });
  });
  app2.get("/stream", (c) => {
    const { response } = sseManager.createStream();
    return response;
  });
  app2.post("/", async (c) => {
    try {
      const body = await c.req.json();
      if (!body.message) {
        return c.json({ error: "message is required" }, 400);
      }
      logStore.log(
        body.level || "info",
        body.message,
        body.data,
        body.source || "system"
      );
      return c.json({ success: true });
    } catch {
      return c.json({ error: "Invalid request body" }, 400);
    }
  });
  return app2;
}

// src/worker/routes/requests.ts
function createRequestsRoutes() {
  const app2 = new Hono2();
  app2.get("/", (c) => {
    const requests2 = requestStore.getAll();
    return c.json({
      requests: requests2,
      total: requests2.length
    });
  });
  app2.get("/:id", (c) => {
    const id = c.req.param("id");
    const request = requestStore.get(id);
    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }
    return c.json(request);
  });
  app2.delete("/", (c) => {
    requestStore.clear();
    return c.json({ success: true });
  });
  return app2;
}

// src/worker/routes/analytics.ts
function getCredentials(c) {
  const headerAccountId = c.req.header("X-CF-Account-ID");
  const headerApiToken = c.req.header("X-CF-API-Token");
  if (headerAccountId && headerApiToken) {
    return { accountId: headerAccountId, apiToken: headerApiToken, source: "headers" };
  }
  const envAccountId = c.env["CF_ACCOUNT_ID"];
  const envApiToken = c.env["CF_API_TOKEN"];
  if (envAccountId && envApiToken) {
    return { accountId: envAccountId, apiToken: envApiToken, source: "env" };
  }
  return { accountId: null, apiToken: null, source: "none" };
}
function createAnalyticsRoutes() {
  const app2 = new Hono2();
  app2.get("/health", (c) => {
    const { source } = getCredentials(c);
    return c.json({
      status: "ok",
      credentialsSource: source,
      hasCredentials: source !== "none"
    });
  });
  app2.get("/datasets", async (c) => {
    const { accountId, apiToken } = getCredentials(c);
    if (!accountId || !apiToken) {
      return c.json({
        error: "Missing configuration",
        message: "No API credentials found. Please configure your Cloudflare API credentials in Settings, or set CF_ACCOUNT_ID and CF_API_TOKEN environment variables.",
        datasets: []
      }, 400);
    }
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "text/plain"
          },
          body: "SHOW TABLES"
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to list datasets:", errorText);
        return c.json({
          error: "Could not fetch datasets",
          details: errorText,
          datasets: []
        }, 200);
      }
      const result = await response.json();
      const datasets = (result.data || []).map((row) => {
        const name = row.name || Object.values(row)[0];
        return { id: name, name };
      });
      return c.json({ datasets });
    } catch (error) {
      return c.json({
        error: "Failed to fetch datasets",
        message: error instanceof Error ? error.message : "Unknown error",
        datasets: []
      }, 500);
    }
  });
  app2.get("/datasets/:datasetId/schema", async (c) => {
    const { accountId, apiToken } = getCredentials(c);
    const datasetId = c.req.param("datasetId");
    if (!accountId || !apiToken) {
      return c.json({
        error: "Missing configuration",
        message: "No API credentials found. Please configure your Cloudflare API credentials in Settings.",
        columns: []
      }, 400);
    }
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "text/plain"
          },
          body: `SELECT * FROM ${datasetId} LIMIT 1`
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        return c.json({
          error: "Failed to fetch schema",
          details: errorText,
          columns: []
        }, 502);
      }
      const result = await response.json();
      const columns = (result.meta || []).map((col) => ({
        name: col.name,
        type: col.type
      }));
      return c.json({ datasetId, columns });
    } catch (error) {
      return c.json({
        error: "Failed to fetch schema",
        message: error instanceof Error ? error.message : "Unknown error",
        columns: []
      }, 500);
    }
  });
  app2.post("/query", async (c) => {
    const { accountId, apiToken } = getCredentials(c);
    if (!accountId || !apiToken) {
      return c.json({
        error: "Missing configuration",
        message: "No API credentials found. Please configure your Cloudflare API credentials in Settings, or set CF_ACCOUNT_ID and CF_API_TOKEN environment variables.",
        data: [],
        meta: null
      }, 400);
    }
    try {
      const body = await c.req.json();
      let { query } = body;
      const { params } = body;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          let escapedValue;
          if (typeof value === "string") {
            const isIntervalValue = /^'\d+'\s+(SECOND|MINUTE|HOUR|DAY|WEEK|MONTH|YEAR)$/i.test(value);
            if (isIntervalValue) {
              escapedValue = value;
            } else {
              escapedValue = `'${value.replace(/'/g, "''")}'`;
            }
          } else {
            escapedValue = String(value);
          }
          query = query.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), escapedValue);
        });
      }
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "text/plain"
          },
          body: query
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        return c.json({
          error: "Query execution failed",
          message: errorText,
          query,
          data: [],
          meta: null
        }, 502);
      }
      const result = await response.json();
      return c.json({
        data: result.data || [],
        meta: result.meta || [],
        rowCount: result.rows || 0,
        totalRows: result.rows_before_limit_at_least || result.rows || 0
      });
    } catch (error) {
      return c.json({
        error: "Query execution failed",
        message: error instanceof Error ? error.message : "Unknown error",
        data: [],
        meta: null
      }, 500);
    }
  });
  return app2;
}

// src/worker/index.ts
var app = new Hono2();
app.use(
  "*",
  cors({
    origin: [
      "https://studio.localflare.dev",
      "http://localhost:5173",
      "http://localhost:5174"
    ],
    credentials: true
  })
);
var API_PREFIX = "/__localflare";
app.get(`${API_PREFIX}/health`, (c) => {
  logStore.log("info", "Health check: Localflare API is running", void 0, "system");
  return c.json({
    status: "ok",
    message: "Localflare API is running with shared bindings."
  });
});
app.route(`${API_PREFIX}/bindings`, createBindingsRoutes());
app.route(`${API_PREFIX}/d1`, createD1Routes());
app.route(`${API_PREFIX}/kv`, createKVRoutes());
app.route(`${API_PREFIX}/r2`, createR2Routes());
app.route(`${API_PREFIX}/queues`, createQueuesRoutes());
app.route(`${API_PREFIX}/do`, createDORoutes());
app.route(`${API_PREFIX}/logs`, createLogsRoutes());
app.route(`${API_PREFIX}/requests`, createRequestsRoutes());
app.route(`${API_PREFIX}/analytics`, createAnalyticsRoutes());
app.all("*", async (c) => {
  const userWorker = c.env.USER_WORKER;
  if (userWorker) {
    const requestId = requestStore.startRequest(c.req.raw);
    const startTime = Date.now();
    try {
      const response = await userWorker.fetch(c.req.raw.clone());
      await requestStore.completeRequest(requestId, response, startTime);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logStore.log("error", `Request failed: ${errorMessage}`, { requestId, error: errorMessage }, "request");
      return c.json({
        error: "Worker error",
        message: errorMessage
      }, 500);
    }
  }
  return c.json({
    error: "Not found",
    message: "This route is not handled by Localflare API. User worker not bound."
  }, 404);
});
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map