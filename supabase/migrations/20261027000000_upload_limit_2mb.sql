-- Lower the PDF upload limit from 10 MB to 2 MB (matches MAX_UPLOAD_BYTES in src/lib/submissions.ts).
-- `not valid` keeps any existing larger rows; new and updated rows must fit.
alter table public.submissions drop constraint submissions_size_bytes_check;
alter table public.submissions
  add constraint submissions_size_bytes_check check (size_bytes > 0 and size_bytes <= 2097152) not valid;

update storage.buckets set file_size_limit = 2097152 where id = 'materials';
