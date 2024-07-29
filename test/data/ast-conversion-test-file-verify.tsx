import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import React from 'react';
import Component from '../components/..';


describe('Test suite', () => {
	
	it('renders the component', () => {
        renderComponent();
        /* SUGGESTION: .find("selector") --> getByRole("selector"), getByTestId("test-id-selector")*/

        // convert find
        const dashboardCards = component.find('selector');
        userEvent.click(dashboardCards);

        // convert simulate
        expect(dashboardCards.length).toBe(11);

        /* SUGGESTION: .find("selector") --> getByRole("selector"), getByTestId("test-id-selector")*/

        // hostNodes
        component.find('div').toHaveLength(1);
    });

	function renderComponent(props = {}) {
		// convert mount method
		return render(<Component {...props} />);
	}
});
