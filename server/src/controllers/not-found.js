module.exports = () => {
  return {
    headers: {
      "Content-Type": "application/json"
    },
    body: { 
        error: {
            msg: "Route is not found.",
            errCode:'ROUTE_NOT_FOUND' 
        },
        result: null,
        timestamp: new Date().toISOString()
    },
    statusCode: 404
  };
}

