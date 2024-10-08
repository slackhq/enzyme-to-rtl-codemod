import userEvent from "@testing-library/user-event";
import { render, screen, configure } from "@testing-library/react";
import "@testing-library/jest-dom";

configure({
    testIdAttribute: "data-id"
});

import React from 'react';

describe('Test suite', () => {
    it('renders the component', () => {
        // convert mount var
        const component = renderComponent();

        // Conversion suggestion: .find('selector') --> Use component rendered DOM to get the appropriate selector and method: screen.getByRole('selector') or screen.getByTestId('<data-id=...>')

        // convert find
        const dashboardCards = component.find('selector');

        // convert simulate
        userEvent.click(dashboardCards);

        // Conversion suggestion: .find('div') --> Use component rendered DOM to get the appropriate selector and method: screen.getByRole('selector') or screen.getByTestId('<data-id=...>')

        // hostNodes
        component.find('div').toHaveLength(1);
    });
});
