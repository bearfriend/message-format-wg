/**
 * The root of a message structure is a Resource. It is somewhat (but not
 * necessarily entirely) analogous to a single file in a file system.
 *
 * The `[id, locale]` tuple should probably be unique for each resource.
 */
interface Resource {
  id: string
  locale: string
  entries: Record<string, Message | MessageGroup>
  meta?: Meta
}

interface MessageGroup {
  entries: Record<string, Message | MessageGroup>
  meta?: Meta
}

/**
 * Additional meta information amy be attached to most nodes. In common use,
 * this information is not required when formatting a message.
 */
interface Meta {
  comment?: string
  [key: string]: unknown
}

/**
 * The core of the spec, the representation of a single message.
 * The shape of the value is an implementation detail, and may vary for the
 * same message in different languages.
 */
interface Message {
  value: Pattern | Select
  meta?: Meta
}

/**
 * The body of each message is composed of a sequence of parts, some of them
 * fixed (Literal), others placeholders for values depending on additional
 * data.
 */
type Pattern = Part[]

/**
 * Select generalises the plural, selectordinal and select argument types of
 * MessageFormat 1. Each case is defined by a key of one or more string
 * identifiers, and selection between them is made according to the values of
 * a corresponding number of placeholders. The result of the selection is
 * always a single Pattern.
 *
 * It is likely that in nearly all cases the source of the placeholder's value
 * will be a variable in the local scope.
 */
interface Select {
  select: Part[]
  cases: Array<{ key: Literal[]; value: Pattern; meta?: Meta }>
}

/**
 * A Value is either a literal, immediately defined value, or a reference to a
 * value that depends on another message, the value of some runtime variable,
 * or some function defined elsewhere.
 *
 * Each of the types that may be used as a Value must be (and are) immediately
 * distinguishable from each other.
 */
type Part = Literal | VariableReference | FunctionReference | MessageReference

/**
 * An immediately defined value.
 *
 * A numerical value probably only makes sense when used e.g. as a fixed
 * argument of a FunctionReference, but its use is not technically prohibited
 * elsewhere.
 */
type Literal = string | number

/**
 * Variables are defined by the current Scope.
 *
 * Using an array with more than one value refers to an inner property of an
 * object value, so e.g. `['user', 'name']` would require something like
 * `{ name: 'Kat' }` as the value of the `'user'` scope variable.
 */
interface VariableReference {
  var_path: Path
  meta?: Meta
}

/**
 * To resolve a FunctionReference, an externally defined function is called.
 *
 * The `func` identifies a function that takes in the arguments `args`, the
 * current locale, as well as any `options`, and returns some corresponding
 * output. Likely functions available by default would include `'plural'` for
 * determining the plural category of a numeric value, as well as `'number'`
 * and `'date'` for formatting values.
 *
 * It is intentional that the `options` do not allow for reference values to
 * be used, as that would add significant requirements to the runtime
 * resolution of a FunctionReference.
 */
interface FunctionReference {
  func: string
  args: Part[]
  options?: Record<string, string | number | boolean>
  meta?: Meta
}

/**
 * A MessageReference is a pointer to a Message or a Select.
 *
 * If `res_id` is undefined, the message is sought in the current Resource.
 * If it is set, it identifies the resource for the sought message. It is
 * entirely intentional that this value may not be defined at runtime.
 * `msg_path` is used to locate the Message within the Resource, and it may
 * include placeholder values.
 *
 * `scope` overrides values in the current scope when resolving the message.
 */
interface MessageReference {
  res_id?: string
  msg_path: Path
  scope?: Scope
  meta?: Meta
}

/**
 * Variables and messages may each be located within their surrounding
 * structures, and require a path to address them. Note that Path allows for
 * its parts to be defined by placeholders as well as literals.
 */
type Path = Part[]

/**
 * At its simplest, a representation of the parameters/arguments passed to a
 * message formatter. Used by the VariableReference resolver, and may be
 * extended in a MessageReference.
 */
type Scope = { [key: string]: Part | boolean | Scope }
