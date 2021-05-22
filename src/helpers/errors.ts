export class BadRequest extends Error {
  public status = 400;
}

export class Unauthorized extends Error {
  public status = 401;
}

export class Forbidden extends Error {
  public status = 403;
}
