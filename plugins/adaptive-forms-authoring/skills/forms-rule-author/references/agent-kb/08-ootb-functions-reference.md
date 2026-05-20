# OOTB Functions Reference

Catalog of out-of-the-box functions usable directly inside rule expressions (`condition`, `expression`, `actions[]`, or `FUNCTION_CALL` nodes in v1 STATEMENT AST).

For runtime helpers exposed inside custom function bodies as `globals.functions.*` (e.g. `setProperty`, `markFieldAsInvalid`, `getFiles`), see `13-custom-function-helper-apis.md`.

For v2-specific action aliases (`hide`, `show`, `setProperty`, `reset`, …) and v2-only envelope shapes, see `08-v2-functions-reference.md` (v2 skill only).

---

## json-formula core

Built-in JMESPath/json-formula functions. Source: `@adobe/json-formula` jmespath core.

| Signature | Args | Description |
|-----------|------|-------------|
| `abs(value)` → `number` | `value: number` | Returns the absolute value of the provided argument `value`. Returns: returns the absolute value of the `value` argument |
| `avg(elements)` → `number` | `elements: number[]` | Returns the average of the elements in the provided array. An empty array will produce a return value of `null`. Returns: average value |
| `ceil(num)` → `number` | `num: number` | Returns the next highest integer value of the argument `num` by rounding up if necessary. |
| `contains(subject, search)` → `boolean` | `subject: array|string`<br/>`search: string|boolean|number|date` | Returns true if the given `subject` contains the provided `search` string. If `subject` is an array, this function returns true if one of the elements in the array is equal to the provided `search` value. If the provided `subject` is a string, this function returns true if the string contains the provided `search` argument. |
| `endsWith(subject, suffix)` → `boolean` | `subject: string`<br/>`suffix: string` | Returns true if the `subject` ends with the `suffix`, otherwise this function returns false. |
| `floor(num)` → `number` | `num: number` | Returns the next lowest integer value of the argument `num` by rounding down if necessary. |
| `join(glue, stringsarray)` → `string` | `glue: string`<br/>`stringsarray: string[]` | Returns all the elements from the provided `stringsarray` array joined together using the `glue` argument as a separator between each. |
| `keys(obj)` → `array` | `obj: object` | Returns an array containing the keys of the provided object `obj`. If the passed object is null, the value returned is an empty array |
| `length(subject)` → `number` | `subject: string | array | object` | Returns the length of the given argument `subject` using the following types rules: * string: returns the number of code points in the string * array: returns the number of elements in the array * object: returns the number of key-value pairs in the object |
| `map(expr, elements)` → `array` | `expr: expression`<br/>`elements: array` | Apply the `expr` to every element in the `elements` array and return the array of results. An elements of length N will produce a return array of length N. Unlike a projection, `[*].bar`, `map()` will include the result of applying the `expr` for every element in the elements array, even if the result is `null`. |
| `max(collection)` → `number` | `collection: number[]|string[]` | Returns the highest value in the provided `collection` arguments. If all collections are empty `null` is returned. max() can work on numbers or strings. If a mix of numbers and strings are provided, the type of the first value will be used. |
| `merge(args)` → `object` | `args: ...object` | Accepts 0 or more objects as arguments, and returns a single object with subsequent objects merged. Each subsequent object’s key/value pairs are added to the preceding object. This function is used to combine multiple objects into one. You can think of this as the first object being the base object, and each subsequent argument being overrides that are applied to the base object. |
| `min(collection)` → `number` | `collection: number[]|string[]` | Returns the lowest value in the provided `collection` arguments. If all collections are empty `null` is returned. min() can work on numbers or strings. If a mix of numbers and strings are provided, the type of the first value will be used. |
| `notNull(argument)` → `any` | `argument: ...any` | Returns the first argument that does not resolve to `null`. This function accepts one or more arguments, and will evaluate them in order until a non null argument is encounted. If all arguments values resolve to null, then a value of null is returned. |
| `reduce(expr, elements)` → `any` | `expr: expression`<br/>`elements: array` | executes a user-supplied reducer expression `expr` on each element of the array, in order, passing in the return value from the calculation on the preceding element. The final result of running the reducer across all elements of the `elements` array is a single value. The expression can access the following properties * accumulated: accumulated value based on the previous calculations. Initial value is `null` * current: current element to process * index: index of the `current` element in the array * array: original array |
| `register(functionName, expr)` → `{` | `functionName: string`<br/>`expr: expression` | Register a function to allow code re-use. The registered function may take one parameter. If more parameters are needed, combine them in an array or map. Returns: } returns an empty object |
| `reverse(argument)` → `array` | `argument: string|array` | Reverses the order of the `argument`. |
| `sort(list)` → `number[]|string[]` | `list: number[]|string[]` | This function accepts an array `list` argument and returns the sorted elements of the `list` as an array. The array must be a list of strings or numbers. Sorting strings is based on code points. Locale is not taken into account. |
| `sortBy(elements, expr)` → `array` | `elements: array`<br/>`expr: expression` | Sort an array using an expression `expr` as the sort key. For each element in the array of elements, the `expr` expression is applied and the resulting value is used as the key used when sorting the elements. If the result of evaluating the `expr` against the current array element results in type other than a number or a string, a type error will occur. |
| `startsWith(subject, prefix)` → `boolean` | `subject: string`<br/>`prefix: string` | Returns true if the `subject` starts with the `prefix`, otherwise returns false. |
| `sum(collection)` → `number` | `collection: number[]` | Returns the sum of the provided `collection` array argument. An empty array will produce a return value of 0. |
| `toArray(arg)` → `array` | `arg: any` | converts the passed `arg` to an array. The conversion happens as per the following rules * array - Returns the passed in value. * number/string/object/boolean - Returns a one element array containing the argument. |
| `toNumber(arg)` → `number` | `arg: any` | converts the passed arg to a number. The conversion happens as per the following rules * string - Returns the parsed number. * number - Returns the passed in value. * array - null * object - null * boolean - null * null - null |
| `toString(arg)` → `string` | `arg: any` | converts the passed `arg` to a string. The conversion happens as per the following rules * string - Returns the passed in value. * number/array/object/boolean - The JSON encoded value of the object. |
| `type(subject)` → `string` | `subject: any` | Returns the JavaScript type of the given `subject` argument as a string value. The return value MUST be one of the following: * number * string * boolean * array * object * null |
| `values(obj)` → `array` | `obj: object` | Returns the values of the provided object `obj`. Note that because JSON hashes are inherently unordered, the values associated with the provided object obj are inherently unordered. |
| `zip(arrays)` → `array` | `arrays: ...array` | Returns a convolved (zipped) array containing grouped arrays of values from the array arguments from index 0, 1, 2, etc. This function accepts a variable number of arguments. The length of the returned array is equal to the length of the shortest array. Returns: An array of arrays with elements zipped together |

---

## json-formula extensions

Excel-like and additional helpers layered on top of the jmespath core. Source: `@adobe/json-formula` openFormulaFunctions.

| Signature | Args | Description |
|-----------|------|-------------|
| `casefold(input)` → `string` | `input: string` | Returns a lower-case string of the `input` string using locale-specific mappings. e.g. Strings with German lowercase letter 'ß' can be compared to 'ss' Returns: A new string converted to lower case |
| `day(arg1)` → `number` | `arg1: number` | Returns the day of a date, represented by a serial number. The day is given as an integer ranging from 1 to 31. |
| `entries(obj)` → `any[]` | `obj: object` | returns an array of a given object's property `[key, value]` pairs. Returns: an array of [key, value] pairs |
| `exp(x)` → `number` | `x: any` | Returns e (the base of natural logarithms) raised to a power x. (i.e. e<sup>x</sup>) Returns: e (the base of natural logarithms) raised to a power x |
| `fromEntries(pairs)` → `object` | `pairs: any[]` | returns an object by transforming a list of key-value `pairs` into an object. |
| `hour(arg1)` → `number` | `arg1: number` | Extract the hour (0 through 23) from a time/datetime representation |
| `left(subject, elements?)` → `string|array` | `subject: string|array`<br/>`elements?: number` | Return a selected number of text characters from the left or in case of array selected number of elements from the start |
| `lower(input)` → `string` | `input: string` | Converts all the alphabetic characters in a string to lowercase. If the value is not a string it will be converted into string using the default toString method Returns: the lower case value of the input string |
| `mid(subject, startPos, length)` → `string|array` | `subject: string|array`<br/>`startPos: number`<br/>`length: number` | Returns extracted text, given an original text, starting position, and length. or in case of array, extracts a subset of the array from start till the length number of elements. Returns null if the `startPos` is greater than the length of the array |
| `minute(arg1)` → `number` | `arg1: number` | Extract the minute (0 through 59) from a time/datetime representation |
| `mod(dividend, divisor)` → `number` | `dividend: number`<br/>`divisor: number` | Return the remainder when one number is divided by another number. The sign is the same as divisor Returns: Computes the remainder of `dividend`/`divisor`. |
| `month(arg1)` → `number` | `arg1: number` | Returns the month of a date represented by a serial number. The month is given as an integer, ranging from 1 (January) to 12 (December). |
| `now()` → `number` | — | returns the time since epoch with days as exponent and time of day as fraction Returns: representation of current time as a number |
| `power(a, x)` → `number` | `a: number`<br/>`x: number` | Computes `a` raised to a power `x`. (a<sup>x</sup>) |
| `proper(text)` → `string` | `text: string` | Return the input string with the first letter of each word converted to an uppercase letter and the rest of the letters in the word converted to lowercase. |
| `replace(text, start, length, replacement)` → `string` | `text: string`<br/>`start: number`<br/>`length: number`<br/>`replacement: string` | Returns text where an old text is substituted at a given start position and length, with a new text. |
| `rept(text, count)` → `string` | `text: string`<br/>`count: number` | Return text repeated Count times. |
| `right(subject, elements?)` → `string|array` | `subject: string|array`<br/>`elements?: number` | Return a selected number of text characters from the right of a `subject` or in case of array selected number of elements from the end of `subject` array Returns null if the number of elements is less than 0 |
| `round(num, precision)` → `number` | `num: number`<br/>`precision: number` | Round a number to a specified `precision`. ### Remarks * If `precision` is greater than zero, round to the specified number of decimal places. * If `precision` is 0, round to the nearest integer. * If `precision` is less than 0, round to the left of the decimal point. |
| `search(findText, withinText, startPos)` → `array` | `findText: string`<br/>`withinText: string`<br/>`startPos: integer` | Perform a wildcard search. The search is case-sensitive and supports two forms of wildcards: "*" finds a a sequence of characters and "?" finds a single character. To use "*" or "?" as text values, precede them with a tilde ("~") character. Note that the wildcard search is not greedy. e.g. search('a*b', 'abb') will return [0, 'ab'] Not [0, 'abb'] Returns: returns an array with two values: The start position of the found text and the text string that was found. If a match was not found, an empty array is returned. |
| `second(arg1)` → `number` | `arg1: number` | Extract the second (0 through 59) from a time/datetime representation |
| `split(string, separator)` → `string[]` | `string: string`<br/>`separator: string` | split a string into an array, given a separator |
| `sqrt(num)` → `number` | `num: number` | Return the square root of a number |
| `stdev(numbers)` → `number` | `numbers: number[]` | Estimates standard deviation based on a sample. `stdev` assumes that its arguments are a sample of the entire population. If your data represents a entire population, then compute the standard deviation using [stdevp]{@link stdevp}. |
| `stdevp(numbers)` → `number` | `numbers: number[]` | Calculates standard deviation based on the entire population given as arguments. `stdevp` assumes that its arguments are the entire population. If your data represents a sample of the population, then compute the standard deviation using [stdev]{@link stdev}. |
| `time(hours, minutes, seconds)` → `number` | `hours: integer`<br/>`minutes: integer`<br/>`seconds: integer` | Construct and returns time from hours, minutes, and seconds. Returns: Returns the fraction of the day consumed by the given time |
| `today()` | — | returns the number of days since epoch Returns: number |
| `trim(text)` → `string` | `text: string` | Remove leading and trailing spaces, and replace all internal multiple spaces with a single space. Returns: removes all leading and trailing space. Any other sequence of 2 or more spaces is replaced with a single space. |
| `trunc(numA, numB?)` → `number` | `numA: number`<br/>`numB?: number` | Truncates a number to an integer by removing the fractional part of the number. |
| `unique(input)` → `array` | `input: array` | takes an array and returns unique elements within it Returns: array with duplicate elements removed |
| `upper(input)` → `string` | `input: string` | Converts all the alphabetic characters in a string to uppercase. If the value is not a string it will be converted into string using the default toString method Returns: the upper case value of the input string |
| `weekday(arg1, returnType?)` → `number` | `arg1: number`<br/>`returnType?: number` | Extract the day of the week from a date; if text, uses current locale to convert to a date. Returns: day of the week |
| `year(arg1)` → `number` | `arg1: number` | Returns the year of a date represented by a serial number. |

---

## Form runtime (defaultFunctions)

Functions exposed by the AEM Forms runtime for use directly in expressions and actions. Includes form lifecycle, validation, data IO, and event/network primitives.

| Signature | Args | Description |
|-----------|------|-------------|
| `addInstance(element, index?)` | `element: any`<br/>`index?: number` | Adds a row instance to a repeatable panel. If `index` is omitted, the row is appended. |
| `awaitFn(promise, success, error?)` | `promise: any`<br/>`success: string`<br/>`error?: string` | Awaits a promise; on fulfillment dispatches the success event with the resolved value as $event.payload, on rejection dispatches the error event. |
| `decrypt(encryptedData, originalRequest?)` → `object` | `encryptedData: any`<br/>`originalRequest?: object` | Decrypts data previously encrypted via encrypt (idempotent default — returns input unchanged unless overridden). Returns: decrypted payload |
| `dispatchEvent(element, eventName, payload?, dispatch?)` | `element: any`<br/>`eventName: string`<br/>`payload?: any`<br/>`dispatch?: boolean` | Dispatches a custom or built-in event on the target element. The call is async and enqueued. |
| `encrypt(payload, publicKey?)` → `object` | `payload: object`<br/>`publicKey?: string` | Encrypts a payload (idempotent default — returns input unchanged unless overridden). Returns: encrypted payload mirroring input shape (with cryptoMetadata when configured) |
| `exportData()` → `object` | — | Returns the current form data snapshot. Returns: form data |
| `externalize(url)` → `string` | `url: string` | Prefixes a URL with the AEM context path. Idempotent default implementation returns the URL unchanged. Returns: externalized URL |
| `formatInput(input, format)` → `string` | `input: string`<br/>`format: string` | Returns: Formatted input string |
| `getBrowserDetail(param)` | `param: any` | Returns: The value of the requested browser detail or an empty string if not found. |
| `getQueryParameter(param)` | `param: any` | Returns: The value of the query parameter if found, or an empty string if not found. |
| `getRelativeInstanceIndex(repeatableFieldSet)` | `repeatableFieldSet: any` | Returns: Index of given repeatable fieldSet ancestor for current field. If repeatable fieldSet is not ancestor of current field, last index of repeatable fieldSet is returned |
| `getURLDetail(param)` | `param: any` | Returns: The value of the requested `window.location` property or an empty string if not found. |
| `getVariable(name, target?)` → `any` | `name: string`<br/>`target?: any` | Reads a runtime variable previously stored with setVariable. Returns: stored value, or undefined |
| `importData(payload, qualifiedName?)` | `payload: any`<br/>`qualifiedName?: string` | Replaces field/form values from the given payload. |
| `removeInstance(element, index?)` | `element: any`<br/>`index?: number` | Removes a row instance from a repeatable panel. If `index` is omitted, the last row is removed. |
| `request(uri, method, payload?, success?, error?, headers?)` | `uri: string`<br/>`method: string`<br/>`payload?: any`<br/>`success?: string`<br/>`error?: string`<br/>`headers?: object` | Make an HTTP request. Response is delivered asynchronously by dispatching the named success or error event with the payload. |
| `saveForm(url?)` | `url?: string` | Saves the form to the given save URL (typically produced via externalize). |
| `setFocus(element, flag?)` | `element: any`<br/>`flag?: any` | Sets focus to the target field. |
| `setVariable(name, value, target?)` | `name: string`<br/>`value: any`<br/>`target?: any` | Stores a runtime variable scoped to the form (or to the given target). |
| `submitForm(data?, validateForm?, contentType?)` | `data?: any`<br/>`validateForm?: boolean`<br/>`contentType?: string` | Submits the form. The runtime accepts both new-style (data, validateForm, contentType) and legacy callback signatures; prefer the new-style. |
| `today()` → `number` | — | Returns: today at midnight |
| `validate(element?)` → `array` | `element?: any` | Validates a field, panel, or the whole form. Returns an array of validation results — empty array means valid. Returns: validation results (empty when valid) |
