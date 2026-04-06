-- Allow authenticated users to insert their own role (bootstrap: only if no admin exists yet)
CREATE POLICY "Bootstrap first admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
);