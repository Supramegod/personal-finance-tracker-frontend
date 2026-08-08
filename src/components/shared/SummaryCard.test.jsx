import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SummaryCard from '@/components/shared/SummaryCard'

describe('SummaryCard', () => {
  it('menampilkan judul dan jumlah dalam format rupiah', () => {
    render(<SummaryCard title="Pemasukan" amount={1500000} type="income" />)

    expect(screen.getByText('Pemasukan')).toBeInTheDocument()
    expect(screen.getByText(/Rp\s?1\.500\.000/)).toBeInTheDocument()
    expect(screen.getByText('Bulan Ini')).toBeInTheDocument()
  })

  it('memakai warna income untuk type income', () => {
    render(<SummaryCard title="Pemasukan" amount={1000} type="income" />)

    expect(screen.getByText(/Rp\s?1\.000/)).toHaveClass('text-income')
  })

  it('memakai warna expense untuk type selain income', () => {
    render(<SummaryCard title="Pengeluaran" amount={1000} type="expense" />)

    expect(screen.getByText(/Rp\s?1\.000/)).toHaveClass('text-expense')
  })

  it('menyembunyikan konten dan menampilkan skeleton saat isLoading', () => {
    const { container } = render(
      <SummaryCard title="Pemasukan" amount={1500000} type="income" isLoading />
    )

    expect(screen.queryByText('Pemasukan')).not.toBeInTheDocument()
    expect(screen.queryByText(/Rp/)).not.toBeInTheDocument()
    expect(container.querySelectorAll('.skeleton')).toHaveLength(3)
  })
})
