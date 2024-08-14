import React from 'react';
import { mount } from 'enzyme';

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

const Component = () => (
    <div>
        <h1>Hello, World!</h1>
        <div className="DashboardCard">Card 1</div>
        <button className="clickMe">Click Me</button>
    </div>
);
