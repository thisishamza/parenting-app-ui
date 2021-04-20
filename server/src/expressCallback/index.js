function makeExpressCallback(controller) {
  return (req, res, next) => {
    const httpRequest = {
      body: req.body,
      file: req.file,
      query: req.query || {},
      params: req.params || {},
      ip: req.ip,
      method: req.method,
      path: req.path,
      headers: {
        "Content-Type": req.get("Content-Type"),
        Referer: req.get("referer"),
        "User-Agent": req.get("User-Agent"),
        "Authorization": req.get("Authorization")
      },
      locals: {
        user: res.locals.user
      }
    };
    try {
      const httpResponse = controller();

      if (httpResponse.callNext) {
        res.locals = httpRequest.locals;
        return next();
      }
      if (httpResponse.headers) {
        res.set(httpResponse.headers);
      }
      res.type("json");
      res.status(httpResponse.statusCode).send(httpResponse.body);
    } catch (e) {
      res.status(500).send({ error: "An unkown error occurred." });
      console.log(e);
    }
  };
}

module.exports = makeExpressCallback;