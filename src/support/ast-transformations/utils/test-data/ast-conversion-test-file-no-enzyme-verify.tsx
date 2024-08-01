import userEvent from "@testing-library/user-event";
import React from 'react';
import Component from '../components/..';
import { renderComponent } from '../enzyme-helper/..';

describe('Test suite', () => {
	
	it('renders the component', () => {
        // convert mount var
        const component = renderComponent();

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
});
