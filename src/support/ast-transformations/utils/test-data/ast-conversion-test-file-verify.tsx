import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import React from 'react';
import Component from '..';

describe('Test suite', () => {
    it('renders the component', () => {
        renderComponent();
        /* SUGGESTION: .find("selector") --> getByRole("selector"), getByTestId("test-id-selector")*/

        // convert find
        const dashboardCards = component.find('selector');

        // convert simulate
        userEvent.click(dashboardCards);

        expect(dashboardCards.length).toBe(11);

        /* SUGGESTION: .find("selector") --> getByRole("selector"), getByTestId("test-id-selector")*/

        // hostNodes
        component.find('div').toHaveLength(1);

        // convert exists
        expect(dashboardCards).toBeInTheDocument();
    });

    function renderComponent(props = {}): any {
        // convert mount method
        return render(<Component {...props} />);
    }
});
