"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashTokenString = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const crypto_1 = __importDefault(require("crypto"));
const generateAccessToken = (payload) => {
    const nonce = crypto_1.default.randomUUID();
    return jsonwebtoken_1.default.sign({ ...payload, jti: nonce }, config_1.config.jwt.accessSecret, {
        expiresIn: config_1.config.jwt.accessExpiresIn,
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    const nonce = crypto_1.default.randomUUID();
    const token = jsonwebtoken_1.default.sign({ ...payload, jti: nonce }, config_1.config.jwt.refreshSecret, {
        expiresIn: config_1.config.jwt.refreshExpiresIn,
    });
    const hash = crypto_1.default.createHash('sha256').update(token).digest('hex');
    // Calculate expiration (7 days default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return { token, hash, expiresAt };
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessSecret);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
const hashTokenString = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
exports.hashTokenString = hashTokenString;
