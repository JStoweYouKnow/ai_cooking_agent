import { extractCookingTimeFromInstructions } from '../recipeParsing';

describe('extractCookingTimeFromInstructions', () => {
  test('extracts time from "bake for X minutes"', () => {
    const instructions = 'Preheat oven to 350°F. Bake for 30 minutes or until golden brown.';
    expect(extractCookingTimeFromInstructions(instructions)).toBe(30);
  });

  test('extracts time from "cook for X hours"', () => {
    const instructions = 'Place in slow cooker and cook for 2 hours on high.';
    expect(extractCookingTimeFromInstructions(instructions)).toBe(120);
  });

  test('extracts time from range and uses higher value', () => {
    const instructions = 'Bake for 30-45 minutes until done.';
    expect(extractCookingTimeFromInstructions(instructions)).toBe(45);
  });

  test('extracts longest time when multiple times present', () => {
    const instructions = 'Sauté for 5 minutes. Then bake for 1 hour. Cool for 10 minutes.';
    expect(extractCookingTimeFromInstructions(instructions)).toBe(60);
  });

  test('handles "X minutes at Y degrees" pattern', () => {
    const instructions = 'Bake at 350°F for 45 minutes at 350 degrees.';
    expect(extractCookingTimeFromInstructions(instructions)).toBe(45);
  });

  test('handles various cooking verbs', () => {
    expect(extractCookingTimeFromInstructions('Roast for 90 minutes')).toBe(90);
    expect(extractCookingTimeFromInstructions('Grill for 15 minutes')).toBe(15);
    expect(extractCookingTimeFromInstructions('Simmer for 1.5 hours')).toBe(90);
    expect(extractCookingTimeFromInstructions('Microwave for 3 minutes')).toBe(3);
  });

  test('returns null when no time found', () => {
    const instructions = 'Mix ingredients together and serve immediately.';
    expect(extractCookingTimeFromInstructions(instructions)).toBeNull();
  });

  test('returns null for empty or undefined instructions', () => {
    expect(extractCookingTimeFromInstructions('')).toBeNull();
    expect(extractCookingTimeFromInstructions(null)).toBeNull();
    expect(extractCookingTimeFromInstructions(undefined)).toBeNull();
  });

  test('handles decimal hours', () => {
    const instructions = 'Cook for 1.5 hours until tender.';
    expect(extractCookingTimeFromInstructions(instructions)).toBe(90);
  });

  test('handles abbreviated units', () => {
    expect(extractCookingTimeFromInstructions('Bake for 25 min')).toBe(25);
    expect(extractCookingTimeFromInstructions('Cook for 2 hr')).toBe(120);
  });
});
