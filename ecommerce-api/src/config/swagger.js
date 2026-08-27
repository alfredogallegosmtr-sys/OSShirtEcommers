import swaggerJsdoc from "swagger-jsdoc";

// Los schemas reflejan la respuesta REAL de la API, no siempre el modelo Mongoose crudo —
// ej. Cart aquí es la forma que arma cart.controller.js (`{ items, total }`, con `product`
// siempre poblado), no el `{ products, total }` que guarda el documento en Mongo.
const definition = {
  openapi: "3.0.0",
  info: {
    title: "OSShirtEcommers API",
    version: "1.0.0",
    description:
      "API REST del backend de OSShirtEcommers (ecommerce de camisetas de anime/manga/" +
      "cultura pop). Auth por JWT Bearer; sin cookies ni sesiones.",
  },
  servers: [
    { url: "http://localhost:4001/api", description: "Desarrollo local" },
    // La URL de Render se agrega aquí cuando exista un despliegue real (E10) — no se
    // inventa una URL de ejemplo mientras tanto.
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Token obtenido en POST /auth/register o /auth/login (campo `token`). Enviar como " +
          "`Authorization: Bearer <token>`. Payload real: { userId, name, role }.",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "66f1a2b3c4d5e6f7a8b9c0d1" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["customer", "admin"], default: "customer" },
          isActive: { type: "boolean", default: true },
          email_verified: { type: "boolean", default: false },
          last_login: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RegisterResponse: {
        type: "object",
        description: "Respuesta real de POST /auth/register — no incluye password ni tokens.",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["customer", "admin"] },
        },
      },
      AuthTokens: {
        type: "object",
        description: "Respuesta real de POST /auth/login.",
        properties: {
          token: { type: "string", description: "Access token JWT." },
          refreshToken: { type: "string", description: "Refresh token JWT." },
        },
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number", minimum: 0 },
          stock: { type: "integer", default: 0 },
          imageURL: { type: "string", default: "https://placehold.co/600x400" },
          images: { type: "array", items: { type: "string" } },
          slug: { type: "string" },
          sizes: {
            type: "array",
            items: { type: "string", enum: ["XS", "S", "M", "L", "XL", "XXL"] },
          },
          tags: { type: "array", items: { type: "string" } },
          average_rating: { type: "number", default: 0 },
          review_count: { type: "integer", default: 0 },
          is_active: { type: "boolean", default: true },
          is_deleted: { type: "boolean", default: false, description: "Soft delete." },
          category: {
            oneOf: [
              { type: "string", description: "ObjectId de Category, sin poblar" },
              { $ref: "#/components/schemas/Category" },
            ],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          type: {
            type: "string",
            enum: [
              "anime", "manga-novelas", "japon", "kpop-culture",
              "videojuegos", "cultura-pop", "originales", "colecciones",
            ],
          },
          slug: { type: "string" },
          imageURL: { type: "string", default: "https://placehold.co/800x600.png" },
          parentCategory: { type: "string", nullable: true, description: "ObjectId de Category padre." },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CartItem: {
        type: "object",
        description: "Forma real de un ítem tal como lo devuelve la API (no el subdocumento crudo).",
        properties: {
          id: { type: "string", description: "_id del subdocumento en Cart.products — es el `itemId` de PATCH/DELETE /cart/:itemId." },
          quantity: { type: "integer", minimum: 1 },
          product: { $ref: "#/components/schemas/Product" },
        },
      },
      Cart: {
        type: "object",
        description: "Respuesta real de la API (GET/POST/PATCH/DELETE /cart), no el documento Mongo crudo.",
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/CartItem" } },
          total: { type: "number" },
        },
      },
      Address: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string", description: "ObjectId de User." },
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          postalCode: { type: "string" },
          country: { type: "string" },
          phone: { type: "string" },
          isDefault: { type: "boolean", default: false },
          addressType: { type: "string", enum: ["home", "work", "other"], default: "home" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PaymentMethod: {
        type: "object",
        description:
          "Nunca incluye cardNumber ni cvv (decisión S-03) — solo last4 para mostrar en UI.",
        properties: {
          _id: { type: "string" },
          user: { type: "string", description: "ObjectId de User." },
          type: {
            type: "string",
            enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"],
          },
          last4: { type: "string", maxLength: 4 },
          brand: { type: "string", example: "visa" },
          cardHolderName: { type: "string" },
          expiryDate: { type: "string" },
          paypalEmail: { type: "string", format: "email" },
          bankName: { type: "string" },
          accountNumber: { type: "string" },
          isDefault: { type: "boolean", default: false },
          isActive: { type: "boolean", default: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      OrderProductLine: {
        type: "object",
        description: "Snapshot del precio al momento de la compra, no una referencia viva al producto.",
        properties: {
          productId: {
            oneOf: [
              { type: "string" },
              { $ref: "#/components/schemas/Product" },
            ],
          },
          quantity: { type: "integer", minimum: 1 },
          price: { type: "number" },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string", description: "ObjectId de User." },
          products: { type: "array", items: { $ref: "#/components/schemas/OrderProductLine" } },
          address: {
            oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Address" }],
          },
          paymentMethod: {
            oneOf: [{ type: "string" }, { $ref: "#/components/schemas/PaymentMethod" }],
          },
          subtotalPrice: { type: "number" },
          shippingCost: { type: "number" },
          totalPrice: { type: "number" },
          status: {
            type: "string",
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
            default: "pending",
          },
          paymentStatus: {
            type: "string",
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      WishList: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string", description: "ObjectId de User." },
          products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ErrorMessage: {
        type: "object",
        description: "Forma real de los errores 401/403/404/422 manuales de este proyecto.",
        properties: {
          message: { type: "string" },
        },
      },
      ValidationError: {
        type: "object",
        description: "Forma nativa de express-validator (middleware validate), no un formato custom.",
        properties: {
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", example: "field" },
                value: {},
                msg: { type: "string" },
                path: { type: "string" },
                location: { type: "string", example: "body" },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  definition,
  // JSDoc @openapi en los archivos de rutas reales — no se documentan endpoints
  // que no existan en el código.
  apis: ["./src/routes/*.js"],
};

export default swaggerJsdoc(options);
