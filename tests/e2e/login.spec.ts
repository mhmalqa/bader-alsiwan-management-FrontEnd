import { expect, test } from '@playwright/test'

test('login validates credentials through the API and does not create a local session', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('البريد الإلكتروني').fill('missing@example.test')
  await page.getByLabel('كلمة المرور').fill('not-a-real-password')
  const response = page.waitForResponse((candidate) => candidate.url().includes('/api/backend/v1/auth/login'))
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click()
  await expect((await response).status()).toBe(422)
  await expect(page.locator('.error-message')).toContainText('بيانات تسجيل الدخول غير صحيحة')
  await expect(page).toHaveURL(/\/login$/)
})
