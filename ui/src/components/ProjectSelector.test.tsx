import { setupServer } from "msw/node";
import { render } from "../test-utils";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FeastUISansProviders from "../FeastUISansProviders";

import {
  projectsListWithDefaultProject,
  creditHistoryRegistry,
  creditHistoryRegistryDB,
} from "../mocks/handlers";

// declare which API requests to mock
const server = setupServer(
  projectsListWithDefaultProject,
  creditHistoryRegistry,
  creditHistoryRegistryDB,
);

// establish API mocking before all tests
beforeAll(() => server.listen());
// reset any request handlers that are declared as a part of our tests
// (i.e. for testing one-time error scenarios)
afterEach(() => server.resetHandlers());
// clean up once the tests are done
afterAll(() => server.close());

test("in a full App render, it shows the right initial project", async () => {
  const user = userEvent.setup();

  render(<FeastUISansProviders />);

  const select = await screen.findByLabelText("Select a Feast Project");

  // Wait for Project List to Load

  const topLevelNavigation = await screen.findByRole("navigation", {
    name: "Top Level",
  });

  await within(topLevelNavigation).findByDisplayValue("Credit Score Project");

  expect(select).toBeInTheDocument();

  // Wait for Project Data from Registry to Load
  await screen.findAllByRole("heading", {
    name: /Project: credit_scoring_aws/i,
  });

  // Before User Event: Heading is the credit scoring project
  screen.getByRole("heading", {
    name: /credit_scoring_aws/i,
  });

  const selectElement = within(topLevelNavigation).getByLabelText(
    "Select a Feast Project",
  );
  await user.click(selectElement);

  // Find and click the option
  const option = await screen.findByText("Credit Score Project");
  await user.click(option);

  // The selection should be updated - check the select value
  expect(selectElement).toHaveValue("credit_score_project");

  // ... and the new heading should appear
  // meaning we successfully navigated
  await screen.findByRole("heading", {
    name: /Project: credit_scoring_aws/i,
  });
});
