import { logClientEvent } from "../utils/clientLog.js";

export const createClientLog = async (req, res) => {
  const { event, message, kind, status, path: clientPath, stack, componentStack } = req.body;

  await logClientEvent(event, {
    ip: req.ip,
    message,
    kind,
    status,
    path: clientPath,
    stack,
    componentStack,
  });

  res.status(204).end();
};
