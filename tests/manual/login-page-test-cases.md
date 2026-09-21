# Login page — test cases

Feature under test: Login page with two fields.
- Email: must be a valid email address; domain must be exactly `inbox.lv` (no other domains allowed).
- Password: must be between 6 and 16 characters long (inclusive).

Assumptions made where the feature description didn't specify a detail (called out inline next to the relevant test case too):
- A test account exists with email `user@inbox.lv` and password `Passw0rd1` for tests that require a real, matching login. This account and its credentials are assumed, not provided.
- No maximum length is given for the email field, only the format + domain rule, so the full min/max/min-1/max+1 length boundary set doesn't apply to email — only empty, whitespace-only, and a very-long-value overflow check are included for it.
- Whitespace-only input is assumed to be trimmed and treated as empty, and leading/trailing whitespace around an otherwise valid value is assumed to be trimmed before validation. If the app does not trim input, these test cases will fail and should be reviewed against actual behavior.
- Domain matching is assumed to be case-insensitive (`INBOX.LV` treated the same as `inbox.lv`).
- Subdomains of `inbox.lv` (e.g. `mail.inbox.lv`) are assumed to be rejected, since the rule states the domain must be `inbox.lv`, not "ends with inbox.lv".
- The login API endpoint path isn't specified, so API-level negative cases refer generically to "the login endpoint" rather than a concrete route.

## Happy path

Title: Successful login with valid inbox.lv email and valid password

Preconditions: User is on the Login page. A registered account exists with email `user@inbox.lv` and password `Passw0rd1`.

Steps:
1. Enter "user@inbox.lv" in the Email field.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result: The user is logged in and redirected to the post-login page.

Severity: Critical

Status: draft

## Boundary values

Title: Password with exactly 6 characters is accepted (minimum valid length)

Preconditions: User is on the Login page.

Steps:
1. Enter "user@inbox.lv" in the Email field.
2. Enter "abc123" (6 characters) in the Password field.
3. Click Log in.

Expected Result: No password-length validation error is shown and the login request is submitted.

Severity: Minor

Status: draft

Title: Password with exactly 16 characters is accepted (maximum valid length)

Preconditions: User is on the Login page.

Steps:
1. Enter "user@inbox.lv" in the Email field.
2. Enter "abcdef1234567890" (16 characters) in the Password field.
3. Click Log in.

Expected Result: No password-length validation error is shown and the login request is submitted.

Severity: Minor

Status: draft

Title: Password with 5 characters is rejected (minimum − 1)

Preconditions: User is on the Login page.

Steps:
1. Enter "user@inbox.lv" in the Email field.
2. Enter "abc12" (5 characters) in the Password field.
3. Click Log in.

Expected Result: A validation error stating the password must be between 6 and 16 characters is shown and the form is not submitted.

Severity: Major

Status: draft

Title: Password with 17 characters is rejected (maximum + 1)

Preconditions: User is on the Login page.

Steps:
1. Enter "user@inbox.lv" in the Email field.
2. Enter "abcdef12345678901" (17 characters) in the Password field.
3. Click Log in.

Expected Result: A validation error stating the password must be between 6 and 16 characters is shown and the form is not submitted.

Severity: Major

Status: draft

Title: Empty password is rejected

Preconditions: User is on the Login page.

Steps:
1. Enter "user@inbox.lv" in the Email field.
2. Leave the Password field empty.
3. Click Log in.

Expected Result: A validation error stating the password is required is shown and the form is not submitted.

Severity: Major

Status: draft

Title: Whitespace-only password is rejected

Preconditions: User is on the Login page.

Steps:
1. Enter "user@inbox.lv" in the Email field.
2. Enter "      " (6 spaces) in the Password field.
3. Click Log in.

Expected Result: The whitespace-only value is treated as empty and a validation error stating the password is required is shown. (Assumption: input is trimmed before validation.)

Severity: Trivial

Status: draft

Title: Very long password is rejected without truncation or crash

Preconditions: User is on the Login page.

Steps:
1. Enter "user@inbox.lv" in the Email field.
2. Enter a 500-character string in the Password field.
3. Click Log in.

Expected Result:
- A validation error stating the password must be between 6 and 16 characters is shown.
- The page does not crash, freeze, or silently truncate the value.

Severity: Major

Status: draft

Title: Empty email is rejected

Preconditions: User is on the Login page.

Steps:
1. Leave the Email field empty.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result: A validation error stating the email is required is shown and the form is not submitted.

Severity: Major

Status: draft

Title: Whitespace-only email is rejected

Preconditions: User is on the Login page.

Steps:
1. Enter "      " (6 spaces) in the Email field.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result: The whitespace-only value is treated as empty and a validation error stating the email is required is shown. (Assumption: input is trimmed before validation.)

Severity: Trivial

Status: draft

Title: Very long email address does not crash or silently truncate validation

Preconditions: User is on the Login page.

Steps:
1. Enter a 300-character local part followed by "@inbox.lv" (e.g. 300 "a" characters + "@inbox.lv") in the Email field.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result:
- The form either accepts the address if it is within a reasonable email length limit, or shows a clear validation error that the email is too long.
- The page does not crash, freeze, or silently truncate the value.

Severity: Major

Status: draft

## Equivalence partitions

Title: Valid inbox.lv email with dot and plus-alias in the local part is accepted

Preconditions: User is on the Login page.

Steps:
1. Enter "jane.doe+test@inbox.lv" in the Email field.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result: No email-format or domain validation error is shown and the login request is submitted.

Severity: Minor

Status: draft

Title: Valid email format with a non-inbox.lv domain is rejected

Preconditions: User is on the Login page.

Steps:
1. Enter "user@gmail.com" in the Email field.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result: A validation error stating only inbox.lv email addresses are allowed is shown and the form is not submitted.

Severity: Major

Status: draft

Title: Malformed email (missing @ symbol) is rejected

Preconditions: User is on the Login page.

Steps:
1. Enter "userinbox.lv" in the Email field.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result: A validation error stating the email address is invalid is shown and the form is not submitted.

Severity: Major

Status: draft

Title: Email with a subdomain of inbox.lv is rejected

Preconditions: User is on the Login page.

Steps:
1. Enter "user@mail.inbox.lv" in the Email field.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result: A validation error stating only inbox.lv email addresses are allowed is shown and the form is not submitted. (Assumption: subdomains of inbox.lv do not satisfy the "domain must be inbox.lv" rule.)

Severity: Minor

Status: draft

Title: Email whose domain contains "inbox.lv" as a substring but doesn't match exactly is rejected

Preconditions: User is on the Login page.

Steps:
1. Enter "user@notinbox.lv" in the Email field.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result: A validation error stating only inbox.lv email addresses are allowed is shown and the form is not submitted, confirming the domain check is an exact match and not a substring match.

Severity: Major

Status: draft

Title: Email domain in a different letter case is accepted

Preconditions: User is on the Login page.

Steps:
1. Enter "user@INBOX.LV" in the Email field.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result: No domain validation error is shown and the login request is submitted. (Assumption: domain matching is case-insensitive.)

Severity: Minor

Status: draft

Title: Leading and trailing whitespace around a valid email is trimmed and accepted

Preconditions: User is on the Login page.

Steps:
1. Enter " user@inbox.lv " (with a leading and trailing space) in the Email field.
2. Enter "Passw0rd1" in the Password field.
3. Click Log in.

Expected Result: The whitespace is trimmed, no validation error is shown, and the login request is submitted. (Assumption: input is trimmed before validation.)

Severity: Trivial

Status: draft

Title: Login is rejected when the password doesn't match the registered account

Preconditions: User is on the Login page. A registered account exists with email `user@inbox.lv` and password `Passw0rd1`.

Steps:
1. Enter "user@inbox.lv" in the Email field.
2. Enter "WrongPass1" in the Password field.
3. Click Log in.

Expected Result: A generic "Invalid email or password" error is shown, the user is not logged in, and the error does not indicate which field was wrong.

Severity: Critical

Status: draft

Title: Login is rejected for a valid-format inbox.lv email with no registered account

Preconditions: User is on the Login page. No account exists with email `nouser@inbox.lv`.

Steps:
1. Enter "nouser@inbox.lv" in the Email field.
2. Enter "SomePass1" in the Password field.
3. Click Log in.

Expected Result: A generic "Invalid email or password" error is shown, the user is not logged in, and the error does not reveal whether the email is registered.

Severity: Major

Status: draft

## Negative cases

Note: "Duplicate value where uniqueness is required" is skipped for this feature. Login doesn't create or store any value that must be unique — uniqueness constraints apply to account registration (e.g. a unique email at sign-up), not to the login flow.

Title: API rejects a login request where the email field is a number instead of a string

Preconditions: The server is running and the login endpoint is reachable.

Steps:
1. Send a POST request to the login endpoint with a JSON body where `email` is `12345` (a number) and `password` is a valid string.
2. Inspect the response.

Expected Result:
- The response has `success: false` and a non-null `error` message describing the invalid input.
- The server responds with an appropriate 4xx status code and does not crash.

Severity: Major

Status: draft

Title: API rejects a login request where the password field is a boolean instead of a string

Preconditions: The server is running and the login endpoint is reachable.

Steps:
1. Send a POST request to the login endpoint with a JSON body where `email` is `"user@inbox.lv"` and `password` is `true` (a boolean).
2. Inspect the response.

Expected Result:
- The response has `success: false` and a non-null `error` message describing the invalid input.
- The server responds with an appropriate 4xx status code and does not crash.

Severity: Major

Status: draft

Title: API rejects a login request with the email field missing entirely

Preconditions: The server is running and the login endpoint is reachable.

Steps:
1. Send a POST request to the login endpoint with a JSON body that omits the `email` key entirely, containing only a valid `password`.
2. Inspect the response.

Expected Result:
- The response has `success: false` and a non-null `error` message stating the email is required.
- The server responds with an appropriate 4xx status code and does not crash.

Severity: Major

Status: draft

Title: API rejects a login request with the password field missing entirely

Preconditions: The server is running and the login endpoint is reachable.

Steps:
1. Send a POST request to the login endpoint with a JSON body that omits the `password` key entirely, containing only a valid `email`.
2. Inspect the response.

Expected Result:
- The response has `success: false` and a non-null `error` message stating the password is required.
- The server responds with an appropriate 4xx status code and does not crash.

Severity: Major

Status: draft
