import React from 'react';
import { mount } from 'enzyme';
import Component from '../components/..';


describe('Test suite', () => {
	
	it('renders the component', () => {
		// convert mount var
		const component = renderComponent();

		// convert find
		const dashboardCards = component.find('selector');
		dashboardCards.simulate('click');

		// update
		component.update()

		// convert simulate
		expect(dashboardCards.length).toBe(11);

		// hostNodes
		component.find('div').hostNodes().toHaveLength(1);
	});

	function renderComponent(props = {}) {
		// convert mount method
		return mount(
			<Component {...props} />
		);
	}
});
