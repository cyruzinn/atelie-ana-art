
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

CREATE POLICY "no direct access to orders" ON public.orders FOR SELECT TO authenticated USING (false);
CREATE POLICY "no direct access to download_tokens" ON public.download_tokens FOR SELECT TO authenticated USING (false);
