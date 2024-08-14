import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import React from 'react';
import Component from '../components/..';


describe('Test suite', () => {
	
	it('renders the component', () => {
        renderComponent();
        // Conversion suggestion: .find('selector') --> Use component rendered DOM to get the appropriate selector and method: screen.getByRole('selector') or screen.getByTestId('<data-id=...>')

        // convert find
        const dashboardCards = component.find('selector');

        // convert simulate
        userEvent.click(dashboardCards);

        // Conversion suggestion: .find('div') --> Use component rendered DOM to get the appropriate selector and method: screen.getByRole('selector') or screen.getByTestId('<data-id=...>')

        // hostNodes
        component.find('div').toHaveLength(1);

        // convert exists
        expect(dashboardCards).toBeInTheDocument();
    });

	function renderComponent(props) {
		// convert mount method
		return render(<Component {...props} />);
	}
});
