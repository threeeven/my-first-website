import { onRequest as __api_diaries_ts_onRequest } from "D:\\Code\\my-website\\functions\\api\\diaries.ts"
import { onRequest as __api_upload_ts_onRequest } from "D:\\Code\\my-website\\functions\\api\\upload.ts"

export const routes = [
    {
      routePath: "/api/diaries",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_diaries_ts_onRequest],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_upload_ts_onRequest],
    },
  ]