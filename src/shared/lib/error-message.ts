import { isHttpError, NetworkError } from '../api';

export function getErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'Нет доступа к серверам Wildberries. Проверьте интернет; если включён VPN или блокировщик — отключите его.';
  }

  if (isHttpError(error)) {
    return `Сервер Wildberries ответил ошибкой ${error.status}. Попробуйте ещё раз позже.`;
  }

  return 'Что-то пошло не так. Попробуйте ещё раз.';
}
