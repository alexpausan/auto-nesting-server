"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
// import { makeOpenAICall } from './services/open-ai.js'
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const port = 3000;
app.post('/magic-layout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const inputData = req.body;
    // OpenAI API call
    console.log('inputData', inputData);
    // const nestedStructure = await makeOpenAICall(inputData)
    // console.log('nestedStructure', nestedStructure)
    // Send the response back to the client
    // res.json(nestedStructure)
}));
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
