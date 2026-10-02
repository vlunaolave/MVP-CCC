export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthProviderNotEnabled extends AppError {
  constructor(provider: string) {
    super(`El proveedor ${provider} no está habilitado en este MVP.`, 501, "AUTH_PROVIDER_NOT_ENABLED");
    this.name = "AuthProviderNotEnabled";
  }
}

export class DataSourceNotImplemented extends AppError {
  constructor(source: string) {
    super(`La fuente ${source} no está implementada.`, 501, "DATA_SOURCE_NOT_IMPLEMENTED");
    this.name = "DataSourceNotImplemented";
  }
}

export class RepositoryNotImplemented extends AppError {
  constructor() {
    super("El repositorio de API no está implementado.", 501, "REPOSITORY_NOT_IMPLEMENTED");
    this.name = "RepositoryNotImplemented";
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Correo o contraseña incorrectos.", 401, "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
  }
}

export class InactiveAccountError extends AppError {
  constructor() {
    super("Esta cuenta está desactivada.", 403, "INACTIVE_ACCOUNT");
    this.name = "InactiveAccountError";
  }
}
