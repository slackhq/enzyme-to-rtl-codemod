import React from 'react';
import { mount } from 'enzyme';
import Component from '../components/..';


describe('Test suite', () => {
	
	it('renders the component', () => {
		// convert mount var
		const component = renderComponent();

		// convert find
		const dashboardCards = component.find('selector');

		// convert simulate
		dashboardCards.simulate('click');

		// update
		component.update()

		// hostNodes
		component.find('div').hostNodes().toHaveLength(1);

		// convert exists
        expect(dashboardCards.exists()).toBe(true);
	});

	function renderComponent(props) {
		// convert mount method
		return mount(
			<Component {...props} />
		);
	}
});