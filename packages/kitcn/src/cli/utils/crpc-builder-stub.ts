export const CRPC_BUILDER_STUB_SOURCE = `const createMiddleware = (handler = undefined) => ({
  _handler: handler,
  pipe(nextHandler = undefined) {
    return createMiddleware(nextHandler);
  },
});

const toMetaObject = (value = undefined) =>
  value && typeof value === "object" ? value : {};

const createProcedureExport = (type, state, handler) => ({
  _crpcMeta: {
    type,
    internal: state.internal ?? false,
    ...toMetaObject(state.meta),
  },
  ...(state.httpRoute ? { _crpcHttpRoute: state.httpRoute } : {}),
  _handler: handler,
});

const createProcedureBuilder = (state = {}) => {
  const builder = {
    internal() {
      return createProcedureBuilder({ ...state, internal: true });
    },
    use() {
      return createProcedureBuilder(state);
    },
    meta(value = undefined) {
      return createProcedureBuilder({
        ...state,
        meta: {
          ...toMetaObject(state.meta),
          ...toMetaObject(value),
        },
      });
    },
    input() {
      return createProcedureBuilder(state);
    },
    params() {
      return createProcedureBuilder(state);
    },
    searchParams() {
      return createProcedureBuilder(state);
    },
    paginated(options = undefined) {
      return createProcedureBuilder({
        ...state,
        meta:
          typeof options?.limit === "number"
            ? {
                ...toMetaObject(state.meta),
                limit: options.limit,
              }
            : state.meta,
      });
    },
    output() {
      return createProcedureBuilder(state);
    },
    form() {
      return createProcedureBuilder(state);
    },
    route(path, method) {
      return createProcedureBuilder({
        ...state,
        httpRoute:
          typeof path === "string" && typeof method === "string"
            ? { path, method: method.toUpperCase() }
            : undefined,
      });
    },
    get(path) {
      return builder.route(path, "GET");
    },
    post(path) {
      return builder.route(path, "POST");
    },
    put(path) {
      return builder.route(path, "PUT");
    },
    patch(path) {
      return builder.route(path, "PATCH");
    },
    delete(path) {
      return builder.route(path, "DELETE");
    },
    query(handler = undefined) {
      return createProcedureExport("query", state, handler);
    },
    mutation(handler = undefined) {
      return createProcedureExport("mutation", state, handler);
    },
    action(handler = undefined) {
      return createProcedureExport("action", state, handler);
    },
    middleware(handler = undefined) {
      return createMiddleware(handler);
    },
  };

  return builder;
};

const flattenRouterRecord = (record = {}, prefix = "") => {
  const procedures = {};
  for (const [key, value] of Object.entries(record)) {
    const procedurePath = prefix ? prefix + "." + key : key;
    if (value?._def?.router === true) {
      Object.assign(
        procedures,
        flattenRouterRecord(value._def.record ?? {}, procedurePath)
      );
      continue;
    }
    procedures[procedurePath] = value;
  }
  return procedures;
};

const createRouter = (record = {}) => ({
  _def: {
    router: true,
    procedures: flattenRouterRecord(record),
    record,
  },
});

export const initCRPC = {
  meta() {
    return this;
  },
  dataModel() {
    return this;
  },
  context() {
    return this;
  },
  middleware(handler = undefined) {
    return createMiddleware(handler);
  },
  create() {
    return {
      query: createProcedureBuilder(),
      mutation: createProcedureBuilder(),
      action: createProcedureBuilder(),
      httpAction: createProcedureBuilder(),
      middleware: createMiddleware,
      router: createRouter,
    };
  },
};

export const httpAction = createProcedureBuilder();
`;
