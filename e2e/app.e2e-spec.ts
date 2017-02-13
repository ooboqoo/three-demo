import { ThreeDemoPage } from './app.po';

describe('three-demo App', function() {
  let page: ThreeDemoPage;

  beforeEach(() => {
    page = new ThreeDemoPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
