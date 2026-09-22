/**
 * Firul motorului. Nu decide nimic — doar traduce mesajele către `MLCEngine`
 * (`@mlc-ai/web-llm`). Decizia stă în `./rutare-model.ts`.
 */
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const gestionar = new WebWorkerMLCEngineHandler();

self.onmessage = (mesaj: MessageEvent) => {
  gestionar.onmessage(mesaj);
};
