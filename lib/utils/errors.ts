export function mapSupabaseError(message: string): string {
  if (message.includes('row-level security')) {
    return 'You do not have permission to perform this action.';
  }

  if (message.includes('duplicate key value')) {
    return 'That already exists.';
  }

  if (message.includes('violates check constraint')) {
    return 'That value is not valid.';
  }

  return message;
}

export type ActionSuccess<T> = {
  ok: true;
  data: T;
};

export type ActionFailure = {
  ok: false;
  error: string;
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function actionOk<T>(data: T): ActionSuccess<T> {
  return { ok: true, data };
}

export function actionError(error: string): ActionFailure {
  return { ok: false, error };
}
