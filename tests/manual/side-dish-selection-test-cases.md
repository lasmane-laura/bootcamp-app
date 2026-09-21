# Side-dish selection — test cases

Feature under test: Food delivery app side-dish selection. User must choose exactly one side dish from three options (potatoes, rice, pasta). Selecting none is not allowed, and only one option may be selected at a time (mutually exclusive).

Note: This is not a numeric/length-bounded field, so boundary-value analysis is applied to the *number of selections* (0 / 1 / 2+) instead of a value range. Whitespace-only input doesn't apply, since there's no free-text entry.

## Happy path

Title: User selects potatoes as side dish

Preconditions: User is on the item customization screen for a menu item with a side-dish option.

Steps:
1. Open the item customization screen.
2. Select "Potatoes" as the side dish.
3. Confirm the item and add it to the cart.

Expected Result: Potatoes is recorded as the side dish for the item, and the item is added to the cart.

Severity: Critical

Status: draft

Title: User selects rice as side dish

Preconditions: User is on the item customization screen for a menu item with a side-dish option.

Steps:
1. Open the item customization screen.
2. Select "Rice" as the side dish.
3. Confirm the item and add it to the cart.

Expected Result: Rice is recorded as the side dish for the item, and the item is added to the cart.

Severity: Critical

Status: draft

Title: User selects pasta as side dish

Preconditions: User is on the item customization screen for a menu item with a side-dish option.

Steps:
1. Open the item customization screen.
2. Select "Pasta" as the side dish.
3. Confirm the item and add it to the cart.

Expected Result: Pasta is recorded as the side dish for the item, and the item is added to the cart.

Severity: Critical

Status: draft

## Boundary values

Title: User attempts to add item with no side dish selected

Preconditions: User is on the item customization screen for a menu item with a side-dish option.

Steps:
1. Open the item customization screen.
2. Leave the side-dish selection empty.
3. Attempt to confirm the item and add it to the cart.

Expected Result:
- The item is not added to the cart.
- An inline validation message tells the user to select a side dish.

Severity: Major

Status: draft

Title: User attempts to select two side dishes at once

Preconditions: User is on the item customization screen for a menu item with a side-dish option.

Steps:
1. Open the item customization screen.
2. Select "Potatoes" as the side dish.
3. Select "Rice" as the side dish without deselecting potatoes.

Expected Result: Selecting rice automatically deselects potatoes, leaving only rice selected.

Severity: Major

Status: draft

Title: API rejects request with all three side dishes selected

Preconditions: The server is running and the add-to-cart endpoint is reachable.

Steps:
1. Send a request to add the item to the cart with the side-dish field containing all three values (potatoes, rice, pasta).
2. Inspect the response.

Expected Result: API responds with `success: false`, `data: null`, and an error message stating only one side dish is allowed.

Severity: Major

Status: draft

## Equivalence partitions

Title: User switches side-dish selection before confirming

Preconditions: User is on the item customization screen for a menu item with a side-dish option.

Steps:
1. Open the item customization screen.
2. Select "Potatoes" as the side dish.
3. Select "Pasta" as the side dish.
4. Confirm the item and add it to the cart.

Expected Result: Pasta is recorded as the side dish for the item, and potatoes is not retained.

Severity: Minor

Status: draft

Title: API rejects request with a side-dish value outside the allowed options

Preconditions: The server is running and the add-to-cart endpoint is reachable.

Steps:
1. Send a request to add the item to the cart with the side-dish field set to a value not in the allowed list (e.g. "salad").
2. Inspect the response.

Expected Result: API responds with `success: false`, `data: null`, and an error message stating the side dish is invalid.

Severity: Major

Status: draft

## Negative cases

Title: API rejects request with wrong data type for side dish

Preconditions: The server is running and the add-to-cart endpoint is reachable.

Steps:
1. Send a request to add the item to the cart with the side-dish field set to a non-string value (e.g. `123` or `true`).
2. Inspect the response.

Expected Result: API responds with `success: false`, `data: null`, and an error message stating the side dish must be a valid string value.

Severity: Major

Status: draft

Title: API rejects request missing the side-dish field

Preconditions: The server is running and the add-to-cart endpoint is reachable.

Steps:
1. Send a request to add the item to the cart with the side-dish field omitted entirely from the payload.
2. Inspect the response.

Expected Result: API responds with `success: false`, `data: null`, and an error message stating side dish is required.

Severity: Major

Status: draft

Title: API rejects request with duplicate side-dish values

Preconditions: The server is running and the add-to-cart endpoint is reachable.

Steps:
1. Send a request to add the item to the cart with the side-dish field as an array containing the same value twice (e.g. `["rice", "rice"]`).
2. Inspect the response.

Expected Result: API responds with `success: false`, `data: null`, and an error message stating only one side dish may be provided.

Severity: Major

Status: draft
