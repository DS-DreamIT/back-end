const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Dreamable",
      version: "1.0.0",
      description: "Poket Univ API with express",
    },
    servers: [
      {
        url: "http://localhost:3001",
      },
    ],
    basePath: "/",
  },
  apis: ["./routes/*.js", "./swagger/apis/*", "./swagger/models/*"],
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
