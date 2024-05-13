const hello = () => {
  return 'word';
};

test('hello', () => {
  expect(hello()).toBe('word');
});
